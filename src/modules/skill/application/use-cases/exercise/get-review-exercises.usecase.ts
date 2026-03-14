import { Injectable, Inject } from '@nestjs/common';
import type { ReviewExerciseRepository } from '../../../domain/repositories/review-exercise.repository.interface';
import { SKILL_TOKENS } from '../../../domain/di/tokens';
import { ReviewLessonDto } from '../../dto/review.dto';
import { ExerciseMapper } from '../../mappers/exercise.mapper';
import { Exercise } from '../../../domain/entities/exercise.entity';

@Injectable()
export class GetReviewExercisesUseCase {
  private readonly REVIEW_LIMIT = 5;

  constructor(
    @Inject(SKILL_TOKENS.REVIEW_EXERCISE_REPOSITORY)
    private readonly reviewExerciseRepository: ReviewExerciseRepository,
  ) {}

  async execute(userId: string): Promise<ReviewLessonDto> {
    const wordsToReview =
      await this.reviewExerciseRepository.findWordsForReview(userId, {
        maxMasteryLevel: 3,
        daysSinceLastReview: 1,
        limit: 10,
      });

    const grammarsToReview =
      await this.reviewExerciseRepository.findGrammarsForReview(userId, {
        maxMasteryLevel: 3,
        daysSinceLastReview: 1,
        limit: 10,
      });

    const difficultExercises =
      await this.reviewExerciseRepository.findDifficultExercises(userId, {
        minIncorrectCount: 2,
        maxSuccessRate: 0.5,
        limit: 10,
      });

    const selectedExercises = await this.selectOptimalExercises(
      wordsToReview,
      grammarsToReview,
      difficultExercises,
    );

    const exerciseDtos = selectedExercises.map((e) => ExerciseMapper.toDto(e));

    return {
      id: `review-${userId}-${Date.now()}`,
      skillId: 'review',
      skillLevel: 0,
      title: 'Review Practice',
      position: 0,
      exercises: exerciseDtos,
      exerciseCount: exerciseDtos.length,
      createdAt: new Date(),
    };
  }

  private async selectOptimalExercises(
    wordsToReview: string[],
    grammarsToReview: string[],
    difficultExercises: {
      exerciseId: string;
      incorrectCount: number;
      successRate: number;
    }[],
  ): Promise<Exercise[]> {
    const exercises: Exercise[] = [];

    // Priority 1: Exercises the user got wrong frequently (40%)
    const difficultLimit = Math.ceil(this.REVIEW_LIMIT * 0.4);
    const difficultExerciseIds = difficultExercises
      .slice(0, difficultLimit)
      .map((e) => e.exerciseId);

    if (difficultExerciseIds.length > 0) {
      const found =
        await this.reviewExerciseRepository.findByIds(difficultExerciseIds);
      exercises.push(...found);
    }

    // Priority 2: Exercises containing vocabulary to review (30%)
    const wordLimit = Math.ceil(this.REVIEW_LIMIT * 0.3);
    if (wordsToReview.length > 0) {
      const wordExercises = await this.reviewExerciseRepository.findByWordIds(
        wordsToReview.slice(0, wordLimit),
      );
      exercises.push(...wordExercises);
    }

    // Priority 3: Exercises containing grammar to review (30%)
    const grammarLimit = Math.ceil(this.REVIEW_LIMIT * 0.3);
    if (grammarsToReview.length > 0) {
      const grammarExercises =
        await this.reviewExerciseRepository.findByGrammarIds(
          grammarsToReview.slice(0, grammarLimit),
        );
      exercises.push(...grammarExercises);
    }

    // Deduplicate
    const uniqueExercises = exercises.filter(
      (exercise, index, self) =>
        index === self.findIndex((e) => e.id === exercise.id),
    );

    // Fill with random exercises if not enough
    if (uniqueExercises.length < this.REVIEW_LIMIT) {
      const needed = this.REVIEW_LIMIT - uniqueExercises.length;
      const usedIds = uniqueExercises.map((e) => e.id);
      const randomExercises =
        await this.reviewExerciseRepository.findRandomExercises(
          needed,
          usedIds,
        );
      uniqueExercises.push(...randomExercises);
    }

    return uniqueExercises.slice(0, this.REVIEW_LIMIT);
  }
}
