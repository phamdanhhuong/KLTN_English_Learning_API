import { Exercise, ExerciseType } from '../entities/exercise.entity';

export interface TrainingExerciseQueryOptions {
  maxMasteryLevel: number;
  limit: number;
  exerciseTypes?: ExerciseType[];
}

export interface FrequentlyIncorrectQueryOptions {
  minIncorrectCount: number;
  maxSuccessRate: number;
  limit: number;
  exerciseTypes?: ExerciseType[];
}

export interface TrainingExerciseRepository {
  /**
   * Find exercises linked to words/grammars with low mastery (0-1)
   */
  findExercisesWithLowMastery(
    userId: string,
    options: TrainingExerciseQueryOptions,
  ): Promise<Exercise[]>;

  /**
   * Find exercises with words/grammars the user has never encountered (no mastery record)
   */
  findExercisesWithNoMastery(
    userId: string,
    limit: number,
    exerciseTypes?: ExerciseType[],
  ): Promise<Exercise[]>;

  /**
   * Find exercises the user frequently gets wrong
   */
  findFrequentlyIncorrect(
    userId: string,
    options: FrequentlyIncorrectQueryOptions,
  ): Promise<Exercise[]>;

  /**
   * Find random exercises excluding given IDs
   */
  findRandomExercises(
    limit: number,
    excludeIds: string[],
    exerciseTypes?: ExerciseType[],
  ): Promise<Exercise[]>;
}
