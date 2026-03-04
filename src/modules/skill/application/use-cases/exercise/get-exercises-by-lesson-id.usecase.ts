import { Injectable, Inject } from '@nestjs/common';
import type { ExerciseRepository } from '../../../domain/repositories/exercise.repository.interface';
import { ExerciseDto } from '../../dto/exercise.dto';
import { ExerciseMapper } from '../../mappers/exercise.mapper';
import { SKILL_TOKENS } from '../../../domain/di/tokens';

@Injectable()
export class GetExercisesByLessonIdUseCase {
  constructor(
    @Inject(SKILL_TOKENS.EXERCISE_REPOSITORY)
    private readonly exerciseRepository: ExerciseRepository,
  ) {}

  async execute(lessonId: string): Promise<ExerciseDto[]> {
    const exercises = await this.exerciseRepository.findByLessonId(lessonId);
    return exercises.map((exercise) => ExerciseMapper.toDto(exercise));
  }
}
