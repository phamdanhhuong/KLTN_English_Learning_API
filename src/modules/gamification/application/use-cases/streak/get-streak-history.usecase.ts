import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma.service';

export interface StreakHistoryItem {
  id: string;
  streakLength: number;
  startDate: Date;
  endDate: Date;
  endReason: string;
  freezesUsed: number;
  durationDays: number;
  isActive: boolean;
  freezeDay?: string;
}

export interface StreakHistoryResult {
  userId: string;
  currentStreak: {
    length: number;
    startDate: string;
    lastStudyDate: string | null;
    freezesRemaining: number;
    isCurrentlyFrozen: boolean;
    freezeExpiresAt: string | null;
  };
  longestStreak: number;
  totalStreaks: number;
  history: StreakHistoryItem[];
  statistics: {
    averageStreakLength: number;
    totalActiveDays: number;
    totalFreezesUsed: number;
    streakDistribution: {
      '1-3': number;
      '4-7': number;
      '8-14': number;
      '15-30': number;
      '31+': number;
    };
  };
  success: boolean;
  error?: string;
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

    const historyItems: StreakHistoryItem[] = histories.map(h => ({
      id: h.id,
      streakLength: h.streakLength,
      startDate: h.startDate,
      endDate: h.endDate,
      endReason: h.endReason,
      freezesUsed: 0,
      durationDays: 0,
      isActive: true,
      freezeDay: "",
    }));

    // Tính toán statistics
    const totalStreaks = historyItems.length;
    const totalActiveDays = historyItems.reduce((sum, h) => sum + h.streakLength, 0);
    const averageStreakLength = totalStreaks > 0 ? Math.round(totalActiveDays / totalStreaks) : 0;
    const distribution = { '1-3': 0, '4-7': 0, '8-14': 0, '15-30': 0, '31+': 0 };
    for (const h of historyItems) {
      if (h.streakLength >= 31) distribution['31+']++;
      else if (h.streakLength >= 15) distribution['15-30']++;
      else if (h.streakLength >= 8) distribution['8-14']++;
      else if (h.streakLength >= 4) distribution['4-7']++;
      else distribution['1-3']++;
    }

    // Tính startDate của streak hiện tại
    const currentStreakLength = streakData?.currentStreak ?? 0;
    const lastStudy = streakData?.lastStudyDate;
    const startDate = lastStudy
      ? new Date(new Date(lastStudy).getTime() - (currentStreakLength - 1) * 86400000).toISOString()
      : new Date().toISOString();

    return {
      userId,
      currentStreak: {
        length: currentStreakLength,
        startDate,
        lastStudyDate: lastStudy ? new Date(lastStudy).toISOString() : null,
        freezesRemaining: streakData?.freezeCount ?? 0,
        isCurrentlyFrozen: false,
        freezeExpiresAt: null,
      },
      longestStreak: streakData?.longestStreak ?? 0,
      totalStreaks,
      history: historyItems,
      statistics: {
        averageStreakLength,
        totalActiveDays,
        totalFreezesUsed: 0,
        streakDistribution: distribution,
      },
      success: true,
    };
  }
}
