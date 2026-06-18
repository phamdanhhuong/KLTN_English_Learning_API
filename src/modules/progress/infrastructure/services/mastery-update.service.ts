import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import type { MasteryUpdateServiceInterface } from '../../domain/services/mastery-update.service.interface';

@Injectable()
export class MasteryUpdateService implements MasteryUpdateServiceInterface {
  private readonly logger = new Logger(MasteryUpdateService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * SM-2 algorithm: compute new easiness factor, interval, and repetitions.
   */
  private calculateSM2(
    quality: number,
    ef: number,
    interval: number,
    repetitions: number,
  ): {
    ef: number;
    interval: number;
    repetitions: number;
    nextReviewDate: Date;
  } {
    // Clamp quality to [0, 5]
    quality = Math.max(0, Math.min(5, quality));

    // Update easiness factor
    let newEf = ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (newEf < 1.3) newEf = 1.3;

    let newRepetitions: number;
    let newInterval: number;

    if (quality >= 3) {
      // Successful recall
      if (repetitions === 0) {
        newInterval = 1;
      } else if (repetitions === 1) {
        newInterval = 6;
      } else {
        newInterval = Math.round(interval * newEf);
      }
      newRepetitions = repetitions + 1;
    } else {
      // Failed recall → reset
      newRepetitions = 0;
      newInterval = 1;
    }

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

    return {
      ef: newEf,
      interval: newInterval,
      repetitions: newRepetitions,
      nextReviewDate,
    };
  }

  /**
   * Grade a response quality (0-5) using correctness + behavioral signals.
   *
   * Instead of hardcoded thresholds, we compare the user's time against the
   * global average for that exercise (Dynamic Threshold).
   */
  private gradeQuality(
    exercise: any,
    averageTimeMs: number,
  ): number {
    if (!exercise.isCorrect) {
      // Incorrect: grade based on how many attempts
      return exercise.incorrectCount >= 2 ? 0 : 1;
    }

    if (exercise.incorrectCount > 0) {
      // Correct but needed multiple attempts
      return Math.max(1, 3 - exercise.incorrectCount);
    }

    // Correct on first try → start at 5, apply penalties
    let quality = 5;

    // Time penalty (dynamic threshold): penalise if > 1.5× the global average
    const timeSpent = exercise.timeSpentMs ?? 0;
    if (timeSpent > 0 && averageTimeMs > 0) {
      const ratio = timeSpent / averageTimeMs;
      if (ratio > 2.0) quality -= 2;
      else if (ratio > 1.5) quality -= 1;
    }

    // Hesitation penalty: answer changes signal uncertainty
    const changes = exercise.answerChangeCount ?? 0;
    if (changes >= 3) quality -= 2;
    else if (changes >= 1) quality -= 1;

    // A first-try correct answer should never drop below 3
    return Math.max(3, quality);
  }

  async updateMasteries(
    userId: string,
    exercises: any[],
    wordsMap: Map<string, string[]>,
    grammarsMap: Map<string, string[]>,
  ): Promise<{
    wordMasteriesUpdated: number;
    grammarMasteriesUpdated: number;
  }> {
    let wordMasteriesUpdated = 0;
    let grammarMasteriesUpdated = 0;

    for (const exercise of exercises) {
      // ── 1. Fetch global baseline for this exercise ──
      const globalStat = await this.prisma.exerciseGlobalStat.findUnique({
        where: { exerciseId: exercise.exerciseId },
      });

      // Use global average if we have enough data, otherwise default 15s
      const averageTimeMs =
        globalStat && globalStat.totalAttempts >= 5
          ? globalStat.averageTimeMs
          : 15_000;

      // ── 2. Update global stats (moving average) ──
      const prevTotal = globalStat?.totalAttempts ?? 0;
      const prevAvg = globalStat?.averageTimeMs ?? 0;
      const userTime = exercise.timeSpentMs ?? 15_000;
      const newTotal = prevTotal + 1;
      const newAvg = Math.round(
        (prevAvg * prevTotal + userTime) / newTotal,
      );

      await this.prisma.exerciseGlobalStat.upsert({
        where: { exerciseId: exercise.exerciseId },
        create: {
          exerciseId: exercise.exerciseId,
          averageTimeMs: userTime,
          totalAttempts: 1,
        },
        update: {
          averageTimeMs: newAvg,
          totalAttempts: newTotal,
        },
      });

      // ── 3. Grade quality ──
      const quality = this.gradeQuality(exercise, averageTimeMs);

      // Skip mastery updates for exercises without linked words/grammar
      const exerciseWords = wordsMap.get(exercise.exerciseId) || [];
      const exerciseGrammars = grammarsMap.get(exercise.exerciseId) || [];

      // ── 4. Update word masteries with SM-2 ──
      for (const wordId of exerciseWords) {
        const existing = await this.prisma.wordMastery.findUnique({
          where: { userId_wordId: { userId, wordId } },
        });

        const sm2 = this.calculateSM2(
          quality,
          existing?.easinessFactor ?? 2.5,
          existing?.interval ?? 0,
          existing?.repetitions ?? 0,
        );

        await this.prisma.wordMastery.upsert({
          where: { userId_wordId: { userId, wordId } },
          create: {
            userId,
            wordId,
            masteryLevel: quality >= 3 ? 1 : 0,
            easinessFactor: sm2.ef,
            interval: sm2.interval,
            repetitions: sm2.repetitions,
            nextReviewDate: sm2.nextReviewDate,
            lastReview: new Date(),
          },
          update: {
            masteryLevel: quality >= 3 ? { increment: 1 } : { set: 0 },
            easinessFactor: sm2.ef,
            interval: sm2.interval,
            repetitions: sm2.repetitions,
            nextReviewDate: sm2.nextReviewDate,
            lastReview: new Date(),
          },
        });
        wordMasteriesUpdated++;
      }

      // ── 5. Update grammar masteries with SM-2 ──
      for (const grammarId of exerciseGrammars) {
        const existing = await this.prisma.grammarMastery.findUnique({
          where: { userId_grammarId: { userId, grammarId } },
        });

        const sm2 = this.calculateSM2(
          quality,
          existing?.easinessFactor ?? 2.5,
          existing?.interval ?? 0,
          existing?.repetitions ?? 0,
        );

        await this.prisma.grammarMastery.upsert({
          where: { userId_grammarId: { userId, grammarId } },
          create: {
            userId,
            grammarId,
            masteryLevel: quality >= 3 ? 1 : 0,
            easinessFactor: sm2.ef,
            interval: sm2.interval,
            repetitions: sm2.repetitions,
            nextReviewDate: sm2.nextReviewDate,
            lastReview: new Date(),
          },
          update: {
            masteryLevel: quality >= 3 ? { increment: 1 } : { set: 0 },
            easinessFactor: sm2.ef,
            interval: sm2.interval,
            repetitions: sm2.repetitions,
            nextReviewDate: sm2.nextReviewDate,
            lastReview: new Date(),
          },
        });
        grammarMasteriesUpdated++;
      }
    }

    return { wordMasteriesUpdated, grammarMasteriesUpdated };
  }
}
