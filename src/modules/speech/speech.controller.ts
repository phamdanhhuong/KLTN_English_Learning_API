import {
  Controller,
  Post,
  Req,
  UseInterceptors,
  UploadedFile,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Request } from 'express';
import * as FormData from 'form-data';
import { firstValueFrom } from 'rxjs';

@Controller('speech')
export class SpeechController {
  private readonly speechEndpoint: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.speechEndpoint =
      this.configService.get<string>('SPEECH_ENPOINT') || 'http://localhost:3005';
  }

  @Post('transcribe')
  @UseInterceptors(FileInterceptor('audio_file'))
  async transcribe(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    try {
      const formData = new FormData();

      if (file) {
        formData.append('audio_file', file.buffer, {
          filename: file.originalname,
          contentType: file.mimetype,
        });
      }

      // Forward các fields khác trong body
      if (req.body) {
        for (const [key, value] of Object.entries(req.body)) {
          if (key !== 'audio_file') {
            formData.append(key, String(value));
          }
        }
      }

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.speechEndpoint}/speech/transcribe`,
          formData,
          {
            headers: {
              ...formData.getHeaders(),
            },
            timeout: 120000,
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
          },
        ),
      );

      return response.data;
    } catch (error: any) {
      const status = error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
      const message = error.response?.data?.message || 'Speech service unavailable';
      throw new HttpException(message, status);
    }
  }
}
