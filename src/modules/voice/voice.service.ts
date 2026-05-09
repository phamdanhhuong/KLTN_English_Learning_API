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

  // ─── Fallback config ─────────────────────────────
  private readonly fallbackEnabled: boolean;
  private readonly googleApiKey: string;
  private readonly googleTtsVoice: string;
  private readonly googleTtsLanguage: string;

  // Google Cloud API base URLs
  private readonly GOOGLE_STT_URL =
    'https://speech.googleapis.com/v1/speech:recognize';
  private readonly GOOGLE_TTS_URL =
    'https://texttospeech.googleapis.com/v1/text:synthesize';

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

    // Fallback
    this.fallbackEnabled =
      this.configService.get<string>('SPEECH_FALLBACK_ENABLED') === 'true';
    this.googleApiKey =
      this.configService.get<string>('GOOGLE_CLOUD_API_KEY') || '';
    this.googleTtsVoice =
      this.configService.get<string>('GOOGLE_CLOUD_TTS_VOICE') ||
      'en-US-Neural2-F';
    this.googleTtsLanguage =
      this.configService.get<string>('GOOGLE_CLOUD_TTS_LANGUAGE') || 'en-US';

    if (this.fallbackEnabled && this.googleApiKey) {
      this.logger.log(
        '✅ Google Cloud STT/TTS fallback ENABLED',
      );
    } else if (this.fallbackEnabled && !this.googleApiKey) {
      this.logger.warn(
        '⚠️  Fallback enabled but GOOGLE_CLOUD_API_KEY is empty – fallback will not work',
      );
    }
  }

  // ═══════════════════════════════════════════════════
  //  PUBLIC API
  // ═══════════════════════════════════════════════════

  /**
   * Transcribe audio buffer to text.
   * Tries ngrok STT first, then falls back to Google Cloud STT.
   */
  async transcribe(
    audioBuffer: Buffer,
    filename = 'audio.wav',
  ): Promise<{ text: string; confidence: number; source: string }> {
    // ── Try primary (ngrok) ──
    if (this.shouldTryPrimary(this.sttHealth)) {
      try {
        const result = await this._transcribeNgrok(audioBuffer, filename);
        this.markAvailable(this.sttHealth);
        return { ...result, source: 'primary' };
      } catch (error: any) {
        this.markUnavailable(this.sttHealth);
        this.logger.warn(
          `⚡ Primary STT failed: ${error.message} — trying fallback`,
        );
      }
    }

    // ── Try fallback (Google Cloud) ──
    if (this.canFallback()) {
      try {
        const result = await this._transcribeGoogleCloud(audioBuffer);
        return { ...result, source: 'google_cloud' };
      } catch (error: any) {
        this.logger.error(
          `❌ Google Cloud STT also failed: ${error.message}`,
          error.stack,
        );
      }
    }

    throw new Error('STT service unavailable: all providers failed');
  }

  /**
   * Synthesize text to audio (WAV buffer).
   * Tries ngrok TTS first, then falls back to Google Cloud TTS.
   */
  async synthesize(text: string): Promise<{ audio: Buffer; source: string }> {
    // ── Try primary (ngrok) ──
    if (this.shouldTryPrimary(this.ttsHealth)) {
      try {
        const audio = await this._synthesizeNgrok(text);
        this.markAvailable(this.ttsHealth);
        return { audio, source: 'primary' };
      } catch (error: any) {
        this.markUnavailable(this.ttsHealth);
        this.logger.warn(
          `⚡ Primary TTS failed: ${error.message} — trying fallback`,
        );
      }
    }

    // ── Try fallback (Google Cloud) ──
    if (this.canFallback()) {
      try {
        const audio = await this._synthesizeGoogleCloud(text);
        return { audio, source: 'google_cloud' };
      } catch (error: any) {
        this.logger.error(
          `❌ Google Cloud TTS also failed: ${error.message}`,
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

    // Check fallback availability
    results.stt.fallback = this.canFallback();
    results.tts.fallback = this.canFallback();

    return results;
  }

  // ═══════════════════════════════════════════════════
  //  PRIVATE — Primary (ngrok) implementations
  // ═══════════════════════════════════════════════════

  private async _transcribeNgrok(
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
  }

  private async _synthesizeNgrok(text: string): Promise<Buffer> {
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
  }

  // ═══════════════════════════════════════════════════
  //  PRIVATE — Fallback (Google Cloud) implementations
  // ═══════════════════════════════════════════════════

  /**
   * Google Cloud Speech-to-Text v1 REST API
   * Docs: https://cloud.google.com/speech-to-text/docs/reference/rest/v1/speech/recognize
   */
  private async _transcribeGoogleCloud(
    audioBuffer: Buffer,
  ): Promise<{ text: string; confidence: number }> {
    this.logger.debug('🔄 Using Google Cloud STT fallback');

    const audioContent = audioBuffer.toString('base64');

    const response = await firstValueFrom(
      this.httpService.post(
        `${this.GOOGLE_STT_URL}?key=${this.googleApiKey}`,
        {
          config: {
            encoding: 'LINEAR16',
            sampleRateHertz: 16000,
            languageCode: 'en-US',
            model: 'default',
            enableAutomaticPunctuation: true,
          },
          audio: {
            content: audioContent,
          },
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000,
        },
      ),
    );

    const results = response.data?.results;
    if (!results || results.length === 0) {
      return { text: '', confidence: 0 };
    }

    const topAlternative = results[0]?.alternatives?.[0];
    return {
      text: topAlternative?.transcript || '',
      confidence: topAlternative?.confidence || 0,
    };
  }

  /**
   * Google Cloud Text-to-Speech v1 REST API
   * Docs: https://cloud.google.com/text-to-speech/docs/reference/rest/v1/text/synthesize
   * Returns a WAV audio buffer.
   */
  private async _synthesizeGoogleCloud(text: string): Promise<Buffer> {
    this.logger.debug('🔄 Using Google Cloud TTS fallback');

    const response = await firstValueFrom(
      this.httpService.post(
        `${this.GOOGLE_TTS_URL}?key=${this.googleApiKey}`,
        {
          input: { text },
          voice: {
            languageCode: this.googleTtsLanguage,
            name: this.googleTtsVoice,
          },
          audioConfig: {
            audioEncoding: 'LINEAR16',
            sampleRateHertz: 16000,
          },
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000,
        },
      ),
    );

    // Google returns base64-encoded audio content
    const audioContent = response.data?.audioContent;
    if (!audioContent) {
      throw new Error('Google Cloud TTS returned empty audio');
    }

    return Buffer.from(audioContent, 'base64');
  }

  // ═══════════════════════════════════════════════════
  //  PRIVATE — Health-cache helpers
  // ═══════════════════════════════════════════════════

  /** Should we try the primary service or skip straight to fallback? */
  private shouldTryPrimary(health: ServiceHealth): boolean {
    // If marked available, always try
    if (health.available) return true;

    // If marked unavailable but TTL expired, retry
    const elapsed = Date.now() - health.lastChecked;
    if (elapsed >= this.HEALTH_CACHE_TTL_MS) {
      return true; // give it another chance
    }

    return false;
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
    return this.fallbackEnabled && !!this.googleApiKey;
  }
}
