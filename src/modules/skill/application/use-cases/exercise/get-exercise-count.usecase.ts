import { Injectable, Inject } from '@nestjs/common';
import type { ExerciseRepository } from '../../../domain/repositories/exercise.repository.interface';
import { SKILL_TOKENS } from '../../../domain/di/tokens';

@Injectable()
export class GetExerciseCountUseCase {
  constructor(
    @Inject(SKILL_TOKENS.EXERCISE_REPOSITORY)
    private readonly exerciseRepository: ExerciseRepository,
  ) {}

  async execute(lessonId: string): Promise<number> {
    return await this.exerciseRepository.countByLessonId(lessonId);
  }
}
