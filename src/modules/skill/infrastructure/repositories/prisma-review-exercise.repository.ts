import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import type {
  ReviewExerciseRepository as ReviewExerciseRepositoryInterface,
  ReviewExerciseQueryOptions,
  DifficultExerciseQueryOptions,
  DifficultExerciseResult,
} from '../../domain/repositories/review-exercise.repository.interface';
import { Exercise, ExerciseType } from '../../domain/entities/exercise.entity';

@Injectable()
export class PrismaReviewExerciseRepository implements ReviewExerciseRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  async findWordsForReview(
    userId: string,
    options: ReviewExerciseQueryOptions,
  ): Promise<string[]> {
    const reviewDate = new Date();
    reviewDate.setDate(reviewDate.getDate() - options.daysSinceLastReview);

    const wordMasteries = await this.prisma.wordMastery.findMany({
      where: {
        userId,
        masteryLevel: { lte: options.maxMasteryLevel },
        lastReview: { lte: reviewDate },
      },
      select: { wordId: true },
      orderBy: [{ masteryLevel: 'asc' }, { lastReview: 'asc' }],
      take: options.limit,
    });

    return wordMasteries.map((wm) => wm.wordId);
  }

  async findGrammarsForReview(
    userId: string,
    options: ReviewExerciseQueryOptions,
  ): Promise<string[]> {
    const reviewDate = new Date();
    reviewDate.setDate(reviewDate.getDate() - options.daysSinceLastReview);

    const grammarMasteries = await this.prisma.grammarMastery.findMany({
      where: {
        userId,
        masteryLevel: { lte: options.maxMasteryLevel },
        lastReview: { lte: reviewDate },
      },
      select: { grammarId: true },
      orderBy: [{ masteryLevel: 'asc' }, { lastReview: 'asc' }],
      take: options.limit,
    });

    return grammarMasteries.map((gm) => gm.grammarId);
  }

  async findDifficultExercises(
    userId: string,
    options: DifficultExerciseQueryOptions,
  ): Promise<DifficultExerciseResult[]> {
    const results = await this.prisma.exerciseResult.findMany({
      where: {
        userId,
        incorrectCount: { gte: options.minIncorrectCount },
      },
      select: {
        exerciseId: true,
        correctCount: true,
        incorrectCount: true,
      },
      take: options.limit,
    });

    return results
      .map((r) => {
        const total = r.correctCount + r.incorrectCount;
        const successRate = total > 0 ? r.correctCount / total : 0;
        return {
          exerciseId: r.exerciseId,
          incorrectCount: r.incorrectCount,
          successRate,
        };
      })
      .filter((r) => r.successRate <= options.maxSuccessRate);
  }

  async findByIds(ids: string[]): Promise<Exercise[]> {
    if (ids.length === 0) return [];

    const exercises = await this.prisma.exercise.findMany({
      where: { id: { in: ids } },
    });

    return exercises.map((e) => this.toDomain(e));
  }

  async findByWordIds(wordIds: string[]): Promise<Exercise[]> {
    if (wordIds.length === 0) return [];

    const exerciseWords = await this.prisma.exerciseWord.findMany({
      where: { wordId: { in: wordIds } },
      include: { exercise: true },
    });

    const uniqueExercises = new Map<string, any>();
    for (const ew of exerciseWords) {
      if (!uniqueExercises.has(ew.exercise.id)) {
        uniqueExercises.set(ew.exercise.id, ew.exercise);
      }
    }

    return Array.from(uniqueExercises.values()).map((e) => this.toDomain(e));
  }

  async findByGrammarIds(grammarIds: string[]): Promise<Exercise[]> {
    if (grammarIds.length === 0) return [];

    const exerciseGrammars = await this.prisma.exerciseGrammar.findMany({
      where: { grammarId: { in: grammarIds } },
      include: { exercise: true },
    });

    const uniqueExercises = new Map<string, any>();
    for (const eg of exerciseGrammars) {
      if (!uniqueExercises.has(eg.exercise.id)) {
        uniqueExercises.set(eg.exercise.id, eg.exercise);
      }
    }

    return Array.from(uniqueExercises.values()).map((e) => this.toDomain(e));
  }

  async findRandomExercises(
    limit: number,
    excludeIds: string[],
  ): Promise<Exercise[]> {
    const whereClause: any = {};
    if (excludeIds.length > 0) {
      whereClause.id = { notIn: excludeIds };
    }

    const totalCount = await this.prisma.exercise.count({
      where: whereClause,
    });

    if (totalCount === 0) return [];

    const skip = Math.max(
      0,
      Math.floor(Math.random() * Math.max(0, totalCount - limit)),
    );

    const exercises = await this.prisma.exercise.findMany({
      where: whereClause,
      skip,
      take: limit,
    });

    return exercises.map((e) => this.toDomain(e));
  }

  private toDomain(data: any): Exercise {
    return new Exercise(
      data.id,
      data.lessonId,
      data.exerciseType as ExerciseType,
      data.prompt,
      data.meta,
      data.position,
      data.createdAt,
    );
  }
}
