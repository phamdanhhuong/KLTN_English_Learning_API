import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { ExerciseRepository } from '../../../domain/repositories/exercise.repository.interface';
import { ExerciseDto } from '../../dto/exercise.dto';
import { ExerciseMapper } from '../../mappers/exercise.mapper';
import { SKILL_TOKENS } from '../../../domain/di/tokens';

@Injectable()
export class GetExerciseByIdUseCase {
  constructor(
    @Inject(SKILL_TOKENS.EXERCISE_REPOSITORY)
    private readonly exerciseRepository: ExerciseRepository,
  ) {}

  async execute(id: string): Promise<ExerciseDto> {
    const exercise = await this.exerciseRepository.findById(id);
    if (!exercise) {
      throw new NotFoundException(`Exercise with ID ${id} not found`);
    }
    return ExerciseMapper.toDto(exercise);
  }
}
