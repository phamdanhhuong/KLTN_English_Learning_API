import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as FormData from 'form-data';

@Injectable()
export class VoiceService {
  private readonly logger = new Logger(VoiceService.name);

  // ─── Local Speech Endpoints (Faster-Whisper + Piper on VM) ──
  private readonly sttUrl: string;
  private readonly ttsUrl: string;
  private readonly chatbotUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    const localSpeechUrl =
      this.configService.get<string>('LOCAL_SPEECH_URL') ||
      'http://localhost:8090';

    this.sttUrl = localSpeechUrl;
    this.ttsUrl = localSpeechUrl;
    this.chatbotUrl =
      this.configService.get<string>('AI_SERVICE_ENDPOINT') ||
      'http://localhost:3006';

    this.logger.log(
      `✅ Local Speech Service Configured — STT: ${this.sttUrl}, TTS: ${this.ttsUrl}`,
    );
  }

  // ═══════════════════════════════════════════════════
  //  PUBLIC API
  // ═══════════════════════════════════════════════════

  /**
   * Transcribe audio buffer to text.
   * Uses local Faster-Whisper service.
   */
  async transcribe(
    audioBuffer: Buffer,
    filename = 'audio.wav',
  ): Promise<{ text: string; confidence: number; source: string }> {
    try {
      const result = await this._transcribeViaHttp(
        this.sttUrl,
        audioBuffer,
        filename,
      );
      return { ...result, source: 'local' };
    } catch (error: any) {
      this.logger.error(
        `❌ STT failed: ${error.message}`,
        error.response?.data || error.stack,
      );
      throw new Error(`STT service unavailable: ${error.message}`);
    }
  }

  /**
   * Synthesize text to audio (WAV buffer).
   * Uses local Piper service.
   */
  async synthesize(text: string): Promise<{ audio: Buffer; source: string }> {
    try {
      const audio = await this._synthesizeViaHttp(this.ttsUrl, text);
      return { audio, source: 'local' };
    } catch (error: any) {
      this.logger.error(`❌ TTS failed: ${error.message}`, error.stack);
      throw new Error(`TTS service unavailable: ${error.message}`);
    }
  }

  /**
   * Send message to chatbot and get AI response
   */
  async chat(
    conversationId: string,
    message: string,
    userId: string,
    role = 'voice_partner',
  ): Promise<{ content: string; messageId: string }> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.chatbotUrl}/chat/message`,
          {
            message,
            conversation_id: conversationId,
            user_id: userId,
            role,
            context: { mode: 'voice' },
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': userId,
            },
            timeout: 60000,
          },
        ),
      );

      return {
        content: response.data?.content || response.data?.data?.content || '',
        messageId:
          response.data?.message_id || response.data?.data?.message_id || '',
      };
    } catch (error: any) {
      this.logger.error(
        `Chatbot request failed: ${error.message}`,
        error.stack,
      );
      throw new Error(`Chatbot service unavailable: ${error.message}`);
    }
  }

  /**
   * Start a new voice call conversation
   */
  async startConversation(userId: string): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.chatbotUrl}/chat/start`,
          {
            user_id: userId,
            role: 'voice_partner',
            context: { mode: 'voice', role: 'voice_partner' },
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': userId,
            },
            timeout: 30000,
          },
        ),
      );

      return response.data?.id || response.data?.data?.id || '';
    } catch (error: any) {
      this.logger.error(
        `Start conversation failed: ${error.message}`,
        error.stack,
      );
      throw new Error(`Chatbot service unavailable: ${error.message}`);
    }
  }

  /**
   * Check detailed status of all services
   */
  async checkStatus(): Promise<{
    stt: boolean;
    tts: boolean;
    chatbot: boolean;
  }> {
    const results = {
      stt: false,
      tts: false,
      chatbot: false,
    };

    // Check STT
    try {
      await firstValueFrom(
        this.httpService.get(`${this.sttUrl}/stt/status`, { timeout: 5000 }),
      );
      results.stt = true;
    } catch {
      /* STT unavailable */
    }

    // Check TTS
    try {
      await firstValueFrom(
        this.httpService.get(`${this.ttsUrl}/tts/status`, { timeout: 5000 }),
      );
      results.tts = true;
    } catch {
      /* TTS unavailable */
    }

    // Check chatbot
    try {
      await firstValueFrom(
        this.httpService.get(`${this.chatbotUrl}/chat/health`, {
          timeout: 5000,
        }),
      );
      results.chatbot = true;
    } catch {
      /* Chatbot unavailable */
    }

    return results;
  }

  // ═══════════════════════════════════════════════════
  //  PRIVATE — Generic HTTP helpers for STT/TTS
  //  Both primary and fallback use the same API contract:
  //    STT: POST /stt/transcribe  (multipart form)
  //    TTS: POST /tts/synthesize  (JSON body → arraybuffer)
  // ═══════════════════════════════════════════════════

  /**
   * Transcribe audio via any service that exposes POST /stt/transcribe
   */
  private async _transcribeViaHttp(
    baseUrl: string,
    audioBuffer: Buffer,
    filename = 'audio.wav',
  ): Promise<{ text: string; confidence: number }> {
    const formData = new FormData();
    formData.append('audio_file', audioBuffer, {
      filename,
      contentType: 'audio/wav',
    });
    // Remove hardcoded language so Faster-Whisper can auto-detect (EN/VI)
    // formData.append('language', 'en');

    const response = await firstValueFrom(
      this.httpService.post(`${baseUrl}/stt/transcribe`, formData, {
        headers: { ...formData.getHeaders() },
        timeout: 30000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }),
    );

    return {
      text: response.data?.text || '',
      confidence: response.data?.confidence || 0,
    };
  }

  /**
   * Synthesize text via any service that exposes POST /tts/synthesize
   */
  private async _synthesizeViaHttp(
    baseUrl: string,
    text: string,
  ): Promise<Buffer> {
    const response = await firstValueFrom(
      this.httpService.post(
        `${baseUrl}/tts/synthesize`,
        { text, voice_style: 'friendly' },
        {
          timeout: 30000,
          responseType: 'arraybuffer',
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );

    return Buffer.from(response.data);
  }
}
