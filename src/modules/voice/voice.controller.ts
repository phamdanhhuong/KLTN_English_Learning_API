import { Controller, Get, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { VoiceService } from './voice.service';

@Controller('voice')
export class VoiceController {
  constructor(private readonly voiceService: VoiceService) {}

  /**
   * Check if voice services (STT + TTS + Chatbot) are available.
   * Returns detailed per-provider status including fallback availability.
   */
  @Get('status')
  async getStatus() {
    const status = await this.voiceService.checkStatus();

    const sttReady = status.stt;
    const ttsReady = status.tts;

    return {
      success: true,
      data: {
        ...status,
        allReady: sttReady && ttsReady && status.chatbot,
      },
    };
  }

  /**
   * One-shot TTS: convert text to audio (for reading chat messages aloud)
   */
  @Post('tts')
  async textToSpeech(@Body() body: { text: string }) {
    if (!body.text || body.text.trim().length === 0) {
      throw new HttpException('Text is required', HttpStatus.BAD_REQUEST);
    }

    try {
      const result = await this.voiceService.synthesize(body.text);
      const audioBase64 = result.audio.toString('base64');
      return {
        success: true,
        data: {
          audio: audioBase64,
          format: 'wav',
          text: body.text,
          source: result.source,
        },
      };
    } catch (error: any) {
      throw new HttpException(
        error.message || 'TTS service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
