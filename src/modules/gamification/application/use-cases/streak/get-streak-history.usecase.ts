import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma.service';

export interface StreakHistoryItem {
  streakLength: number;
  startDate: Date;
  endDate: Date;
  endReason: string;
}

export interface StreakHistoryResult {
  currentStreak: number;
  longestStreak: number;
  history: StreakHistoryItem[];
}

@Injectable()
export class GetStreakHistoryUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string, limit = 10): Promise<StreakHistoryResult> {
    const [streakData, histories] = await Promise.all([
      this.prisma.streakData.findUnique({ where: { userId } }),
      this.prisma.streakHistory.findMany({
        where: { streakData: { userId } },
        orderBy: { endDate: 'desc' },
        take: limit,
      }),
    ]);

    return {
      currentStreak: streakData?.currentStreak ?? 0,
      longestStreak: streakData?.longestStreak ?? 0,
      history: histories.map(h => ({
        streakLength: h.streakLength,
        startDate: h.startDate,
        endDate: h.endDate,
        endReason: h.endReason,
      })),
    };
  }
}
