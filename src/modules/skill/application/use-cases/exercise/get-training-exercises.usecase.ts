import { Injectable, Inject } from '@nestjs/common';
import type { TrainingExerciseRepository } from '../../../domain/repositories/training-exercise.repository.interface';
import { SKILL_TOKENS } from '../../../domain/di/tokens';
import { ReviewLessonDto } from '../../dto/review.dto';
import { ExerciseMapper } from '../../mappers/exercise.mapper';
import { ExerciseType } from '../../../domain/entities/exercise.entity';
import {
  TrainingType,
  TRAINING_TYPE_EXERCISE_MAP,
} from '../../../domain/enums/training-type.enum';

@Injectable()
export class GetTrainingExercisesUseCase {
  private readonly TRAINING_LIMIT = 10;

  constructor(
    @Inject(SKILL_TOKENS.TRAINING_EXERCISE_REPOSITORY)
    private readonly trainingExerciseRepository: TrainingExerciseRepository,
  ) {}

  async execute(
    userId: string,
    trainingType?: TrainingType,
  ): Promise<ReviewLessonDto> {
    // Resolve exercise type filter from training type
    const exerciseTypes: ExerciseType[] | undefined = trainingType
      ? TRAINING_TYPE_EXERCISE_MAP[trainingType]
      : undefined;

    // Priority 1: Frequently incorrect exercises (40% = 4 exercises)
    const frequentlyIncorrect =
      await this.trainingExerciseRepository.findFrequentlyIncorrect(userId, {
        minIncorrectCount: 2,
        maxSuccessRate: 0.5,
        limit: Math.ceil(this.TRAINING_LIMIT * 0.4),
        exerciseTypes,
      });

    // Priority 2: Exercises with low mastery words/grammars (30% = 3 exercises)
    const lowMastery =
      await this.trainingExerciseRepository.findExercisesWithLowMastery(userId, {
        maxMasteryLevel: 1,
        limit: Math.ceil(this.TRAINING_LIMIT * 0.3),
        exerciseTypes,
      });

    // Priority 3: Exercises with no mastery (30% = 3 exercises)
    const noMastery =
      await this.trainingExerciseRepository.findExercisesWithNoMastery(
        userId,
        Math.ceil(this.TRAINING_LIMIT * 0.3),
        exerciseTypes,
      );

    // Combine and deduplicate
    const allExercises = [...frequentlyIncorrect, ...lowMastery, ...noMastery];
    const uniqueExercises = allExercises.filter(
      (exercise, index, self) =>
        index === self.findIndex((e) => e.id === exercise.id),
    );

    // Fill with random exercises if not enough
    let finalExercises = uniqueExercises;
    if (uniqueExercises.length < this.TRAINING_LIMIT) {
      const needed = this.TRAINING_LIMIT - uniqueExercises.length;
      const usedIds = uniqueExercises.map((e) => e.id);
      const randomExercises =
        await this.trainingExerciseRepository.findRandomExercises(
          needed,
          usedIds,
          exerciseTypes,
        );
      finalExercises = [...uniqueExercises, ...randomExercises];
    }

    finalExercises = finalExercises.slice(0, this.TRAINING_LIMIT);

    const exerciseDtos = finalExercises.map((e) => ExerciseMapper.toDto(e));

    const title = trainingType
      ? `Training: ${trainingType.charAt(0).toUpperCase() + trainingType.slice(1)}`
      : 'Training Practice';

    return {
      id: `training-${userId}-${Date.now()}`,
      skillId: 'training',
      skillLevel: 0,
      title,
      position: 0,
      exercises: exerciseDtos,
      exerciseCount: exerciseDtos.length,
      createdAt: new Date(),
    };
  }
}
