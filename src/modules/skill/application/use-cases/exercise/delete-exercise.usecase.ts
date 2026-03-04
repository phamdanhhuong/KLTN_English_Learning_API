import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { ExerciseRepository } from '../../../domain/repositories/exercise.repository.interface';
import { SKILL_TOKENS } from '../../../domain/di/tokens';

@Injectable()
export class DeleteExerciseUseCase {
  constructor(
    @Inject(SKILL_TOKENS.EXERCISE_REPOSITORY)
    private readonly exerciseRepository: ExerciseRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const exercise = await this.exerciseRepository.findById(id);
    if (!exercise) {
      throw new NotFoundException(`Exercise with ID ${id} not found`);
    }
    await this.exerciseRepository.delete(id);
  }
}
