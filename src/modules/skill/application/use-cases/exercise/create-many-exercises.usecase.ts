import { Injectable, Inject } from '@nestjs/common';
import type { ExerciseRepository } from '../../../domain/repositories/exercise.repository.interface';
import { CreateExerciseDto, ExerciseDto } from '../../dto/exercise.dto';
import { Exercise } from '../../../domain/entities/exercise.entity';
import { ExerciseMapper } from '../../mappers/exercise.mapper';
import { SKILL_TOKENS } from '../../../domain/di/tokens';

@Injectable()
export class CreateManyExercisesUseCase {
  constructor(
    @Inject(SKILL_TOKENS.EXERCISE_REPOSITORY)
    private readonly exerciseRepository: ExerciseRepository,
  ) {}

  async execute(exercises: CreateExerciseDto[]): Promise<ExerciseDto[]> {
    const exerciseEntities: Exercise[] = [];

    for (const dto of exercises) {
      let position = dto.position;
      if (position === undefined) {
        position = await this.exerciseRepository.getNextAvailablePosition(
          dto.lessonId,
        );
      }

      const exercise = Exercise.create(
        dto.lessonId,
        dto.exerciseType as any,
        dto.prompt,
        dto.meta,
        position,
      );

      exerciseEntities.push(exercise);
    }

    const savedExercises =
      await this.exerciseRepository.createMany(exerciseEntities);
    return savedExercises.map((exercise) => ExerciseMapper.toDto(exercise));
  }
}
