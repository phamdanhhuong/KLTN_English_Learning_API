import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import type { MasteryUpdateServiceInterface } from '../../domain/services/mastery-update.service.interface';

@Injectable()
export class MasteryUpdateService implements MasteryUpdateServiceInterface {
  constructor(private readonly prisma: PrismaService) {}

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
      if (!exercise.isCorrect) continue;

      const exerciseWords = wordsMap.get(exercise.exerciseId) || [];
      const exerciseGrammars = grammarsMap.get(exercise.exerciseId) || [];

      // Update word masteries
      for (const wordId of exerciseWords) {
        await this.prisma.wordMastery.upsert({
          where: { userId_wordId: { userId, wordId } },
          create: { userId, wordId, masteryLevel: 1, lastReview: new Date() },
          update: { masteryLevel: { increment: 1 }, lastReview: new Date() },
        });
        wordMasteriesUpdated++;
      }

      // Update grammar masteries
      for (const grammarId of exerciseGrammars) {
        await this.prisma.grammarMastery.upsert({
          where: { userId_grammarId: { userId, grammarId } },
          create: { userId, grammarId, masteryLevel: 1, lastReview: new Date() },
          update: { masteryLevel: { increment: 1 }, lastReview: new Date() },
        });
        grammarMasteriesUpdated++;
      }
    }

    return { wordMasteriesUpdated, grammarMasteriesUpdated };
  }
}
