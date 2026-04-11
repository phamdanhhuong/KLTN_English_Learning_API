import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import type {
  AiExerciseGeneratorService,
  GeneratedExerciseData,
} from '../../domain/services/ai-exercise-generator.service.interface';

@Injectable()
export class AiExerciseGeneratorServiceImpl
  implements AiExerciseGeneratorService
{
  private readonly logger = new Logger(AiExerciseGeneratorServiceImpl.name);
  private readonly aiEndpoint: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.aiEndpoint =
      this.configService.get<string>('AI_SERVICE_ENDPOINT') ||
      'http://localhost:3006';
  }

  async generateExercises(
    topic: string,
    difficulty: string,
    count: number,
  ): Promise<GeneratedExerciseData[]> {
    try {
      this.logger.log(
        `Generating ${count} exercises for topic="${topic}", difficulty="${difficulty}"`,
      );

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.aiEndpoint}/exercises/generate`,
          {
            topic,
            difficulty,
            exercise_count: count,
          },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 120000,
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
          },
        ),
      );

      const exercises: GeneratedExerciseData[] = response.data.exercises;

      this.logger.log(
        `Successfully generated ${exercises.length} exercises`,
      );

      return exercises;
    } catch (error: any) {
      this.logger.error(
        `Failed to generate exercises: ${error.message}`,
        error.stack,
      );
      const message =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        'AI exercise generation service unavailable';
      throw new Error(message);
    }
  }
}
