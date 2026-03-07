import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';

export interface UserStats {
  profile: {
    userId: string;
    username: string | null;
    fullName: string | null;
    profilePictureUrl: string | null;
  };
  xp: {
    xpPoints: number;
    currentLevel: number;
    totalXpEarned: number;
  };
  streak: {
    currentStreak: number;
    longestStreak: number;
    lastStudyDate: Date | null;
    freezeCount: number;
  };
  currency: {
    gems: number;
    coins: number;
  };
  energy: {
    currentEnergy: number;
    maxEnergy: number;
  };
  activity: {
    todayXp: number;
    weekXp: number;
  };
}

function getVnToday(): Date {
  const now = new Date();
  const vnNow = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return new Date(Date.UTC(vnNow.getUTCFullYear(), vnNow.getUTCMonth(), vnNow.getUTCDate()));
}

@Injectable()
export class GetUserStatsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string): Promise<UserStats> {
    const today = getVnToday();
    const weekAgo = new Date(today.getTime() - 7 * 86400000);

    const [user, streak, currency, energy, activities] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true, fullName: true, profilePictureUrl: true,
          xpPoints: true, currentLevel: true, totalXpEarned: true },
      }),
      this.prisma.streakData.findUnique({ where: { userId } }),
      this.prisma.userCurrency.findUnique({ where: { userId } }),
      this.prisma.userEnergy.findUnique({ where: { userId } }),
      this.prisma.userDailyActivity.findMany({
        where: { userId, activityDate: { gte: weekAgo, lte: today } },
        select: { activityDate: true, xpEarned: true },
      }),
    ]);

    if (!user) throw new NotFoundException('User not found');

    const todayKey = today.toISOString().split('T')[0];
    const todayXp = activities.find(
      a => a.activityDate.toISOString().split('T')[0] === todayKey,
    )?.xpEarned ?? 0;
    const weekXp = activities.reduce((sum, a) => sum + a.xpEarned, 0);

    return {
      profile: {
        userId: user.id, username: user.username, fullName: user.fullName,
        profilePictureUrl: user.profilePictureUrl,
      },
      xp: { xpPoints: user.xpPoints, currentLevel: user.currentLevel, totalXpEarned: user.totalXpEarned },
      streak: {
        currentStreak: streak?.currentStreak ?? 0, longestStreak: streak?.longestStreak ?? 0,
        lastStudyDate: streak?.lastStudyDate ?? null, freezeCount: streak?.freezeCount ?? 0,
      },
      currency: { gems: currency?.gems ?? 0, coins: currency?.coins ?? 0 },
      energy: { currentEnergy: energy?.currentEnergy ?? 0, maxEnergy: energy?.maxEnergy ?? 5 },
      activity: { todayXp, weekXp },
    };
  }
}
