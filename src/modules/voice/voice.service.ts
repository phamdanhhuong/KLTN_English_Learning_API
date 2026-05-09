import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as FormData from 'form-data';

/**
 * Tracks availability of a remote service with a cooldown
 * so we don't hammer a dead endpoint on every request.
 */
interface ServiceHealth {
  available: boolean;
  lastChecked: number; // epoch ms
}

@Injectable()
export class VoiceService {
  private readonly logger = new Logger(VoiceService.name);

  // ─── Primary endpoints (ngrok / local) ───────────
  private readonly sttUrl: string;
  private readonly ttsUrl: string;
  private readonly chatbotUrl: string;

  // ─── Fallback endpoints (Faster-Whisper + Piper on VM) ──
  private readonly fallbackEnabled: boolean;
  private readonly fallbackSttUrl: string;
  private readonly fallbackTtsUrl: string;

  // ─── Health cache (avoid retrying dead services) ──
  private sttHealth: ServiceHealth = { available: true, lastChecked: 0 };
  private ttsHealth: ServiceHealth = { available: true, lastChecked: 0 };

  /** Re-check the primary service after this many ms */
  private readonly HEALTH_CACHE_TTL_MS = 60_000; // 60 s

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

    // Fallback — local Faster-Whisper + Piper on the same VM
    this.fallbackEnabled =
      this.configService.get<string>('SPEECH_FALLBACK_ENABLED') === 'true';
    this.fallbackSttUrl =
      this.configService.get<string>('FALLBACK_STT_URL') ||
      'http://localhost:8090';
    this.fallbackTtsUrl =
      this.configService.get<string>('FALLBACK_TTS_URL') ||
      'http://localhost:8090';

    if (this.fallbackEnabled) {
      this.logger.log(
        `✅ Speech fallback ENABLED — STT: ${this.fallbackSttUrl}, TTS: ${this.fallbackTtsUrl}`,
      );
    }
  }

  // ═══════════════════════════════════════════════════
  //  PUBLIC API
  // ═══════════════════════════════════════════════════

  /**
   * Transcribe audio buffer to text.
   * Tries primary STT first, then falls back to local Faster-Whisper.
   */
  async transcribe(
    audioBuffer: Buffer,
    filename = 'audio.wav',
  ): Promise<{ text: string; confidence: number; source: string }> {
    // ── Try primary (ngrok) ──
    if (this.shouldTryPrimary(this.sttHealth)) {
      try {
        const result = await this._transcribeViaHttp(
          this.sttUrl,
          audioBuffer,
          filename,
        );
        this.markAvailable(this.sttHealth);
        return { ...result, source: 'primary' };
      } catch (error: any) {
        this.markUnavailable(this.sttHealth);
        this.logger.warn(
          `⚡ Primary STT failed: ${error.message} — trying fallback`,
        );
      }
    }

    // ── Try fallback (local Faster-Whisper) ──
    if (this.canFallback()) {
      try {
        const result = await this._transcribeViaHttp(
          this.fallbackSttUrl,
          audioBuffer,
          filename,
        );
        return { ...result, source: 'fallback' };
      } catch (error: any) {
        this.logger.error(
          `❌ Fallback STT also failed: ${error.message}`,
          error.stack,
        );
      }
    }

    throw new Error('STT service unavailable: all providers failed');
  }

  /**
   * Synthesize text to audio (WAV buffer).
   * Tries primary TTS first, then falls back to local Piper.
   */
  async synthesize(text: string): Promise<{ audio: Buffer; source: string }> {
    // ── Try primary (ngrok) ──
    if (this.shouldTryPrimary(this.ttsHealth)) {
      try {
        const audio = await this._synthesizeViaHttp(this.ttsUrl, text);
        this.markAvailable(this.ttsHealth);
        return { audio, source: 'primary' };
      } catch (error: any) {
        this.markUnavailable(this.ttsHealth);
        this.logger.warn(
          `⚡ Primary TTS failed: ${error.message} — trying fallback`,
        );
      }
    }

    // ── Try fallback (local Piper) ──
    if (this.canFallback()) {
      try {
        const audio = await this._synthesizeViaHttp(
          this.fallbackTtsUrl,
          text,
        );
        return { audio, source: 'fallback' };
      } catch (error: any) {
        this.logger.error(
          `❌ Fallback TTS also failed: ${error.message}`,
          error.stack,
        );
      }
    }

    throw new Error('TTS service unavailable: all providers failed');
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
   * Check detailed status of all services
   */
  async checkStatus(): Promise<{
    stt: { primary: boolean; fallback: boolean };
    tts: { primary: boolean; fallback: boolean };
    chatbot: boolean;
  }> {
    const results = {
      stt: { primary: false, fallback: false },
      tts: { primary: false, fallback: false },
      chatbot: false,
    };

    // Check primary STT
    try {
      await firstValueFrom(
        this.httpService.get(`${this.sttUrl}/stt/status`, { timeout: 5000 }),
      );
      results.stt.primary = true;
      this.markAvailable(this.sttHealth);
    } catch {
      this.markUnavailable(this.sttHealth);
    }

    // Check primary TTS
    try {
      await firstValueFrom(
        this.httpService.get(`${this.ttsUrl}/tts/status`, { timeout: 5000 }),
      );
      results.tts.primary = true;
      this.markAvailable(this.ttsHealth);
    } catch {
      this.markUnavailable(this.ttsHealth);
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

    // Check fallback services
    if (this.canFallback()) {
      try {
        await firstValueFrom(
          this.httpService.get(`${this.fallbackSttUrl}/stt/status`, {
            timeout: 5000,
          }),
        );
        results.stt.fallback = true;
      } catch {
        /* Fallback STT unavailable */
      }

      try {
        await firstValueFrom(
          this.httpService.get(`${this.fallbackTtsUrl}/tts/status`, {
            timeout: 5000,
          }),
        );
        results.tts.fallback = true;
      } catch {
        /* Fallback TTS unavailable */
      }
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
    formData.append('language', 'en');

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

  // ═══════════════════════════════════════════════════
  //  PRIVATE — Health-cache helpers
  // ═══════════════════════════════════════════════════

  /** Should we try the primary service or skip straight to fallback? */
  private shouldTryPrimary(health: ServiceHealth): boolean {
    if (health.available) return true;
    // If TTL expired, give primary another chance
    return Date.now() - health.lastChecked >= this.HEALTH_CACHE_TTL_MS;
  }

  private markAvailable(health: ServiceHealth): void {
    health.available = true;
    health.lastChecked = Date.now();
  }

  private markUnavailable(health: ServiceHealth): void {
    health.available = false;
    health.lastChecked = Date.now();
  }

  /** Is fallback configured and usable? */
  private canFallback(): boolean {
    return this.fallbackEnabled;
  }
}
