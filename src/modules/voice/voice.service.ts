import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as FormData from 'form-data';

@Injectable()
export class VoiceService {
  private readonly logger = new Logger(VoiceService.name);
  private readonly sttUrl: string;
  private readonly ttsUrl: string;
  private readonly chatbotUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.sttUrl =
      this.configService.get<string>('NGROK_STT_URL') || 'http://localhost:3005';
    this.ttsUrl =
      this.configService.get<string>('NGROK_TTS_URL') || 'http://localhost:3005';
    this.chatbotUrl =
      this.configService.get<string>('AI_SERVICE_ENDPOINT') ||
      'http://localhost:3006';
  }

  /**
   * Transcribe audio buffer to text via STT service
   */
  async transcribe(audioBuffer: Buffer, filename = 'audio.wav'): Promise<{ text: string; confidence: number }> {
    try {
      const formData = new FormData();
      formData.append('audio_file', audioBuffer, {
        filename,
        contentType: 'audio/wav',
      });
      formData.append('language', 'en');

      const response = await firstValueFrom(
        this.httpService.post(`${this.sttUrl}/stt/transcribe`, formData, {
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
    } catch (error: any) {
      this.logger.error(
        `STT transcription failed: ${error.message}`,
        error.stack,
      );
      throw new Error(`STT service unavailable: ${error.message}`);
    }
  }

  /**
   * Synthesize text to audio via TTS service
   * Returns WAV audio buffer
   */
  async synthesize(text: string): Promise<Buffer> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.ttsUrl}/tts/synthesize`,
          { text, voice_style: 'friendly' },
          {
            timeout: 30000,
            responseType: 'arraybuffer',
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      );

      return Buffer.from(response.data);
    } catch (error: any) {
      this.logger.error(`TTS synthesis failed: ${error.message}`, error.stack);
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
      this.logger.error(`Chatbot request failed: ${error.message}`, error.stack);
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
   * Check if STT and TTS services are available
   */
  async checkStatus(): Promise<{
    stt: boolean;
    tts: boolean;
    chatbot: boolean;
  }> {
    const results = { stt: false, tts: false, chatbot: false };

    try {
      await firstValueFrom(
        this.httpService.get(`${this.sttUrl}/stt/status`, { timeout: 5000 }),
      );
      results.stt = true;
    } catch {
      /* STT unavailable */
    }

    try {
      await firstValueFrom(
        this.httpService.get(`${this.ttsUrl}/tts/status`, { timeout: 5000 }),
      );
      results.tts = true;
    } catch {
      /* TTS unavailable */
    }

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
}
