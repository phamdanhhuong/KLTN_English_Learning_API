import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { VoiceService } from './voice.service';

interface VoiceCallSession {
  userId: string;
  conversationId: string;
  audioBuffer: Buffer[];
  bufferTimer: NodeJS.Timeout | null;
  startTime: number;
  transcripts: Array<{ role: string; text: string; timestamp: number }>;
  isProcessing: boolean;
  wordsSpoken: number;
}

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/voice',
})
export class VoiceGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(VoiceGateway.name);
  private sessions = new Map<string, VoiceCallSession>();

  // Audio buffer threshold: accumulate ~1.5s at 16kHz mono 16bit = ~48KB
  private readonly BUFFER_FLUSH_MS = 1500;
  private readonly MIN_BUFFER_SIZE = 8000; // At least 0.25s of audio

  constructor(private readonly voiceService: VoiceService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.cleanupSession(client.id);
  }

  /**
   * Start a voice call session
   */
  @SubscribeMessage('voice:start')
  async handleVoiceStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string; conversationId?: string },
  ) {
    try {
      this.logger.log(`Starting voice call for user: ${data.userId}`);

      let conversationId = data.conversationId;

      // Create new conversation if not provided
      if (!conversationId) {
        conversationId = await this.voiceService.startConversation(data.userId);
      }

      // Initialize session
      const session: VoiceCallSession = {
        userId: data.userId,
        conversationId,
        audioBuffer: [],
        bufferTimer: null,
        startTime: Date.now(),
        transcripts: [],
        isProcessing: false,
        wordsSpoken: 0,
      };

      this.sessions.set(client.id, session);

      // Send initial greeting from Rex
      client.emit('voice:connected', { conversationId });

      // Get Rex's opening line
      try {
        const greeting = await this.voiceService.chat(
          conversationId,
          '[SYSTEM: Voice call started. Greet the student warmly and ask what they want to practice.]',
          data.userId,
          'voice_partner',
        );

        if (greeting.content) {
          // Send AI text
          client.emit('voice:ai-text', { text: greeting.content });
          session.transcripts.push({
            role: 'assistant',
            text: greeting.content,
            timestamp: Date.now(),
          });

          // Synthesize and send audio
          try {
            const audioBuffer = await this.voiceService.synthesize(
              greeting.content,
            );
            const audioBase64 = audioBuffer.toString('base64');
            client.emit('voice:ai-audio', {
              audio: audioBase64,
              seq: 1,
              isFinal: true,
            });
          } catch (ttsError) {
            this.logger.warn(`TTS for greeting failed: ${ttsError}`);
            // Still send the text even if TTS fails
          }
        }
      } catch (greetingError) {
        this.logger.warn(`Greeting generation failed: ${greetingError}`);
      }

      this.logger.log(
        `Voice call started: conversationId=${conversationId}`,
      );
    } catch (error) {
      this.logger.error(`Failed to start voice call: ${error}`);
      client.emit('voice:error', {
        code: 'START_FAILED',
        message: 'Failed to start voice call',
      });
    }
  }

  /**
   * Receive audio chunk from client
   */
  @SubscribeMessage('voice:audio')
  async handleVoiceAudio(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { audio: string; seq: number },
  ) {
    const session = this.sessions.get(client.id);
    if (!session) {
      client.emit('voice:error', {
        code: 'NO_SESSION',
        message: 'No active voice call session',
      });
      return;
    }

    try {
      // Decode base64 audio and add to buffer
      const audioChunk = Buffer.from(data.audio, 'base64');
      session.audioBuffer.push(audioChunk);

      // Reset buffer flush timer
      if (session.bufferTimer) {
        clearTimeout(session.bufferTimer);
      }

      // Set timer to flush buffer after silence
      session.bufferTimer = setTimeout(() => {
        this.processAudioBuffer(client, session);
      }, this.BUFFER_FLUSH_MS);
    } catch (error) {
      this.logger.error(`Audio chunk processing error: ${error}`);
    }
  }

  /**
   * End voice call
   */
  @SubscribeMessage('voice:end')
  async handleVoiceEnd(@ConnectedSocket() client: Socket) {
    const session = this.sessions.get(client.id);
    if (!session) return;

    // Process any remaining audio
    if (session.audioBuffer.length > 0 && !session.isProcessing) {
      await this.processAudioBuffer(client, session);
    }

    // Calculate summary
    const duration = Math.round((Date.now() - session.startTime) / 1000);
    const userTranscripts = session.transcripts.filter(
      (t) => t.role === 'user',
    );
    const aiTranscripts = session.transcripts.filter(
      (t) => t.role === 'assistant',
    );

    client.emit('voice:summary', {
      duration,
      wordsSpoken: session.wordsSpoken,
      exchanges: userTranscripts.length,
      transcript: session.transcripts,
      conversationId: session.conversationId,
    });

    this.cleanupSession(client.id);
    this.logger.log(
      `Voice call ended: duration=${duration}s, exchanges=${userTranscripts.length}`,
    );
  }

  /**
   * Process accumulated audio buffer: STT → Chat → TTS pipeline
   */
  private async processAudioBuffer(
    client: Socket,
    session: VoiceCallSession,
  ) {
    if (session.isProcessing || session.audioBuffer.length === 0) return;

    session.isProcessing = true;

    try {
      // Concatenate audio buffers (Raw PCM 16kHz 16-bit mono)
      const pcmBuffer = Buffer.concat(session.audioBuffer);
      session.audioBuffer = [];

      // Skip if too small (likely noise)
      if (pcmBuffer.length < this.MIN_BUFFER_SIZE) {
        session.isProcessing = false;
        return;
      }

      // Add a standard 44-byte WAV header for the PCM stream, otherwise whisper/ffmpeg will fail to decode
      const wavHeader = Buffer.alloc(44);
      wavHeader.write('RIFF', 0);
      wavHeader.writeUInt32LE(36 + pcmBuffer.length, 4); // File size
      wavHeader.write('WAVE', 8);
      wavHeader.write('fmt ', 12);
      wavHeader.writeUInt32LE(16, 16); // Subchunk1Size
      wavHeader.writeUInt16LE(1, 20); // AudioFormat (1=PCM)
      wavHeader.writeUInt16LE(1, 22); // NumChannels (1=mono)
      wavHeader.writeUInt32LE(16000, 24); // SampleRate (16kHz)
      wavHeader.writeUInt32LE(16000 * 2, 28); // ByteRate
      wavHeader.writeUInt16LE(2, 32); // BlockAlign
      wavHeader.writeUInt16LE(16, 34); // BitsPerSample
      wavHeader.write('data', 36);
      wavHeader.writeUInt32LE(pcmBuffer.length, 40); // Subchunk2Size
      
      const fullAudio = Buffer.concat([wavHeader, pcmBuffer]);

      // Skip if too small (likely noise)
      if (fullAudio.length < this.MIN_BUFFER_SIZE) {
        session.isProcessing = false;
        return;
      }

      // Step 1: STT — Transcribe user audio
      this.logger.debug(`Transcribing audio: ${fullAudio.length} bytes`);
      const sttResult = await this.voiceService.transcribe(fullAudio);

      if (!sttResult.text || sttResult.text.trim().length === 0) {
        session.isProcessing = false;
        return;
      }

      // Send transcript to client
      client.emit('voice:transcript', {
        text: sttResult.text,
        isFinal: true,
        confidence: sttResult.confidence,
      });

      session.transcripts.push({
        role: 'user',
        text: sttResult.text,
        timestamp: Date.now(),
      });

      // Count words
      session.wordsSpoken += sttResult.text.split(/\s+/).length;

      // Step 2: Chat — Get AI response
      this.logger.debug(`Getting AI response for: "${sttResult.text}"`);
      const chatResult = await this.voiceService.chat(
        session.conversationId,
        sttResult.text,
        session.userId,
        'voice_partner',
      );

      if (!chatResult.content) {
        session.isProcessing = false;
        return;
      }

      // Send AI text to client
      client.emit('voice:ai-text', { text: chatResult.content });

      session.transcripts.push({
        role: 'assistant',
        text: chatResult.content,
        timestamp: Date.now(),
      });

      // Step 3: TTS — Synthesize AI response audio
      try {
        this.logger.debug(`Synthesizing: "${chatResult.content.substring(0, 50)}..."`);
        const audioBuffer = await this.voiceService.synthesize(
          chatResult.content,
        );
        const audioBase64 = audioBuffer.toString('base64');

        client.emit('voice:ai-audio', {
          audio: audioBase64,
          seq: 1,
          isFinal: true,
        });
      } catch (ttsError) {
        this.logger.warn(`TTS failed, client will use text only: ${ttsError}`);
        // Client can still display text even without audio
      }
    } catch (error) {
      this.logger.error(`Audio processing pipeline error: ${error}`);
      client.emit('voice:error', {
        code: 'PROCESSING_FAILED',
        message: 'Failed to process audio',
      });
    } finally {
      session.isProcessing = false;
    }
  }

  /**
   * Clean up session resources
   */
  private cleanupSession(clientId: string) {
    const session = this.sessions.get(clientId);
    if (session) {
      if (session.bufferTimer) {
        clearTimeout(session.bufferTimer);
      }
      this.sessions.delete(clientId);
    }
  }
}
