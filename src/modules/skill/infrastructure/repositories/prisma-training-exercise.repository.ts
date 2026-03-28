import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import type {
  TrainingExerciseRepository as TrainingExerciseRepositoryInterface,
  TrainingExerciseQueryOptions,
  FrequentlyIncorrectQueryOptions,
} from '../../domain/repositories/training-exercise.repository.interface';
import { Exercise, ExerciseType } from '../../domain/entities/exercise.entity';

@Injectable()
export class PrismaTrainingExerciseRepository implements TrainingExerciseRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  async findExercisesWithLowMastery(
    userId: string,
    options: TrainingExerciseQueryOptions,
  ): Promise<Exercise[]> {
    // Find word IDs with low mastery
    const lowMasteryWords = await this.prisma.wordMastery.findMany({
      where: {
        userId,
        masteryLevel: { lte: options.maxMasteryLevel },
      },
      select: { wordId: true },
      orderBy: { masteryLevel: 'asc' },
      take: options.limit,
    });

    // Find grammar IDs with low mastery
    const lowMasteryGrammars = await this.prisma.grammarMastery.findMany({
      where: {
        userId,
        masteryLevel: { lte: options.maxMasteryLevel },
      },
      select: { grammarId: true },
      orderBy: { masteryLevel: 'asc' },
      take: options.limit,
    });

    const wordIds = lowMasteryWords.map((w) => w.wordId);
    const grammarIds = lowMasteryGrammars.map((g) => g.grammarId);

    // Find exercises linked to these words/grammars
    const exerciseIds = new Set<string>();

    if (wordIds.length > 0) {
      const wordExercises = await this.prisma.exerciseWord.findMany({
        where: { wordId: { in: wordIds } },
        select: { exerciseId: true },
      });
      wordExercises.forEach((e) => exerciseIds.add(e.exerciseId));
    }

    if (grammarIds.length > 0) {
      const grammarExercises = await this.prisma.exerciseGrammar.findMany({
        where: { grammarId: { in: grammarIds } },
        select: { exerciseId: true },
      });
      grammarExercises.forEach((e) => exerciseIds.add(e.exerciseId));
    }

    if (exerciseIds.size === 0) return [];

    const exercises = await this.prisma.exercise.findMany({
      where: { id: { in: Array.from(exerciseIds) } },
      take: options.limit,
    });

    return exercises.map((e) => this.toDomain(e));
  }

  async findExercisesWithNoMastery(
    userId: string,
    limit: number,
  ): Promise<Exercise[]> {
    // Find exercises with words that have NO mastery record for this user
    const wordExercises = await this.prisma.exerciseWord.findMany({
      where: {
        word: {
          wordMastery: { none: { userId } },
        },
      },
      select: { exerciseId: true },
      take: limit,
    });

    // Find exercises with grammars that have NO mastery record for this user
    const grammarExercises = await this.prisma.exerciseGrammar.findMany({
      where: {
        grammar: {
          grammarMastery: { none: { userId } },
        },
      },
      select: { exerciseId: true },
      take: limit,
    });

    const exerciseIds = new Set<string>();
    wordExercises.forEach((e) => exerciseIds.add(e.exerciseId));
    grammarExercises.forEach((e) => exerciseIds.add(e.exerciseId));

    if (exerciseIds.size === 0) return [];

    const exercises = await this.prisma.exercise.findMany({
      where: { id: { in: Array.from(exerciseIds) } },
      take: limit,
    });

    return exercises.map((e) => this.toDomain(e));
  }

  async findFrequentlyIncorrect(
    userId: string,
    options: FrequentlyIncorrectQueryOptions,
  ): Promise<Exercise[]> {
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
      orderBy: { incorrectCount: 'desc' },
      take: options.limit * 2, // fetch extra to filter by success rate
    });

    const filtered = results.filter((r) => {
      const total = r.correctCount + r.incorrectCount;
      const successRate = total > 0 ? r.correctCount / total : 0;
      return successRate <= options.maxSuccessRate;
    });

    const exerciseIds = filtered.slice(0, options.limit).map((r) => r.exerciseId);
    if (exerciseIds.length === 0) return [];

    const exercises = await this.prisma.exercise.findMany({
      where: { id: { in: exerciseIds } },
    });

    return exercises.map((e) => this.toDomain(e));
  }

  async findRandomExercises(
    limit: number,
    excludeIds: string[],
  ): Promise<Exercise[]> {
    const whereClause: any = {};
    if (excludeIds.length > 0) {
      whereClause.id = { notIn: excludeIds };
    }

    const totalCount = await this.prisma.exercise.count({ where: whereClause });
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
