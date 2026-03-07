import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma.service';

export interface StreakStatus {
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: Date | null;
  freezeCount: number;
  isStudiedToday: boolean;
  nextMilestone: {
    streakCount: number;
    daysRemaining: number;
    rewards: { gems: number; coins: number };
  } | null;
}

const MILESTONE_LIST = [3, 7, 14, 30, 50, 100, 200, 365];
const MILESTONE_REWARDS: Record<number, { gems: number; coins: number }> = {
  3: { gems: 5, coins: 50 }, 7: { gems: 10, coins: 100 }, 14: { gems: 20, coins: 200 },
  30: { gems: 30, coins: 300 }, 50: { gems: 50, coins: 500 }, 100: { gems: 100, coins: 1000 },
  200: { gems: 200, coins: 2000 }, 365: { gems: 500, coins: 5000 },
};

function getVnToday(): Date {
  const now = new Date();
  const vnNow = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return new Date(Date.UTC(vnNow.getUTCFullYear(), vnNow.getUTCMonth(), vnNow.getUTCDate()));
}

@Injectable()
export class GetStreakStatusUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string): Promise<StreakStatus> {
    const streak = await this.prisma.streakData.findUnique({ where: { userId } });

    if (!streak) {
      return {
        currentStreak: 0, longestStreak: 0, lastStudyDate: null,
        freezeCount: 0, isStudiedToday: false, nextMilestone: this.calcNext(0),
      };
    }

    const today = getVnToday();
    const isStudiedToday = streak.lastStudyDate
      ? streak.lastStudyDate.toISOString().split('T')[0] === today.toISOString().split('T')[0]
      : false;

    return {
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      lastStudyDate: streak.lastStudyDate,
      freezeCount: streak.freezeCount,
      isStudiedToday,
      nextMilestone: this.calcNext(streak.currentStreak),
    };
  }

  private calcNext(current: number) {
    const next = MILESTONE_LIST.find(m => m > current);
    if (!next) return null;
    return { streakCount: next, daysRemaining: next - current, rewards: MILESTONE_REWARDS[next] };
  }
}
