import { Controller, Get, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { VoiceService } from './voice.service';

@Controller('voice')
export class VoiceController {
  constructor(private readonly voiceService: VoiceService) {}

  /**
   * Check if voice services (STT + TTS + Chatbot) are available
   */
  @Get('status')
  async getStatus() {
    const status = await this.voiceService.checkStatus();
    return {
      success: true,
      data: {
        ...status,
        allReady: status.stt && status.tts && status.chatbot,
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
      const audioBuffer = await this.voiceService.synthesize(body.text);
      const audioBase64 = audioBuffer.toString('base64');
      return {
        success: true,
        data: {
          audio: audioBase64,
          format: 'wav',
          text: body.text,
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
