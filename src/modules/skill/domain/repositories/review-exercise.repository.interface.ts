import { Exercise } from '../entities/exercise.entity';

export interface ReviewExerciseQueryOptions {
  maxMasteryLevel: number;
  daysSinceLastReview: number;
  limit: number;
}

export interface DifficultExerciseQueryOptions {
  minIncorrectCount: number;
  maxSuccessRate: number;
  limit: number;
}

export interface DifficultExerciseResult {
  exerciseId: string;
  incorrectCount: number;
  successRate: number;
}

export interface ReviewExerciseRepository {
  findWordsForReview(
    userId: string,
    options: ReviewExerciseQueryOptions,
  ): Promise<string[]>;

  findGrammarsForReview(
    userId: string,
    options: ReviewExerciseQueryOptions,
  ): Promise<string[]>;

  findDifficultExercises(
    userId: string,
    options: DifficultExerciseQueryOptions,
  ): Promise<DifficultExerciseResult[]>;

  findByIds(ids: string[]): Promise<Exercise[]>;

  findByWordIds(wordIds: string[]): Promise<Exercise[]>;

  findByGrammarIds(grammarIds: string[]): Promise<Exercise[]>;

  findRandomExercises(limit: number, excludeIds: string[]): Promise<Exercise[]>;
}
