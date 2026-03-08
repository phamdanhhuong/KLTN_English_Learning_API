import {
  Controller,
  Post,
  Req,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Request } from 'express';
import { firstValueFrom } from 'rxjs';

@Controller()
export class ScoringController {
  private readonly scoringEndpoint: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.scoringEndpoint =
      this.configService.get<string>('SCORING_ENDPOINT') || 'http://localhost:3006';
  }

  @Post('image-description/score')
  async imageDescriptionScore(@Req() req: Request) {
    return this.forwardJson(req, '/image-description/score');
  }

  @Post('exercise-scoring/translate/score')
  async translateScore(@Req() req: Request) {
    return this.forwardJson(req, '/exercise-scoring/translate/score');
  }

  @Post('exercise-scoring/writing-prompt/score')
  async writingPromptScore(@Req() req: Request) {
    return this.forwardJson(req, '/exercise-scoring/writing-prompt/score');
  }

  private async forwardJson(req: Request, path: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.scoringEndpoint}${path}`,
          req.body,
          {
            headers: {
              'Content-Type': 'application/json',
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
      const message = error.response?.data?.message || 'Scoring service unavailable';
      throw new HttpException(message, status);
    }
  }
}
