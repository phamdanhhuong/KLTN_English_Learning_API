import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma.service';
import { AchievementCheckerService } from '../../../../achievement/application/services/achievement-checker.service';
import { FeedService } from '../../../../feed/application/services/feed.service';

export interface UpdateStreakResult {
    currentStreak: number;
    longestStreak: number;
    previousStreak: number;
    isNewDay: boolean;
    streakBroken: boolean;
    freezeUsed: boolean;
    milestoneReached: number | null;
    gemsEarned: number;
    coinsEarned: number;
    nextMilestone: {
        streakCount: number;
        daysRemaining: number;
        rewards: { gems: number; coins: number };
    } | null;
}

const STREAK_MILESTONES: Record<number, { gems: number; coins: number }> = {
    3: { gems: 5, coins: 50 },
    7: { gems: 10, coins: 100 },
    14: { gems: 20, coins: 200 },
    30: { gems: 30, coins: 300 },
    50: { gems: 50, coins: 500 },
    100: { gems: 100, coins: 1000 },
    200: { gems: 200, coins: 2000 },
    365: { gems: 500, coins: 5000 },
};

const MILESTONE_LIST = [3, 7, 14, 30, 50, 100, 200, 365];

function getVnToday(): Date {
    const now = new Date();
    const vnNow = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    return new Date(
        Date.UTC(vnNow.getUTCFullYear(), vnNow.getUTCMonth(), vnNow.getUTCDate()),
    );
}

function isSameDay(a: Date, b: Date): boolean {
    return (
        a.getUTCFullYear() === b.getUTCFullYear() &&
        a.getUTCMonth() === b.getUTCMonth() &&
        a.getUTCDate() === b.getUTCDate()
    );
}

function isYesterday(date: Date, today: Date): boolean {
    const yesterday = new Date(today);
    yesterday.setUTCDate(today.getUTCDate() - 1);
    return isSameDay(date, yesterday);
}

@Injectable()
export class UpdateStreakUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly achievementChecker: AchievementCheckerService,
    private readonly feedService: FeedService,
  ) {}

  async execute(userId: string): Promise<UpdateStreakResult> {
    const today = getVnToday();

    const result = await this.prisma.$transaction(async (tx) => {
      let streak = await tx.streakData.findUnique({ where: { userId } });

      const calcNextMilestone = (current: number) => {
        const next = MILESTONE_LIST.find(m => m > current);
        if (!next) return null;
        return { streakCount: next, daysRemaining: next - current, rewards: STREAK_MILESTONES[next] };
      };

      // User mới — tạo streak
      if (!streak) {
        streak = await tx.streakData.create({
          data: { userId, currentStreak: 1, longestStreak: 1, lastStudyDate: today },
        });
        await tx.userDailyActivity.upsert({
          where: { userId_activityDate: { userId, activityDate: today } },
          update: { streakCount: 1 },
          create: { userId, activityDate: today, streakCount: 1 },
        });
        return {
          currentStreak: 1, longestStreak: 1, previousStreak: 0,
          isNewDay: true, streakBroken: false, freezeUsed: false,
          milestoneReached: null, gemsEarned: 0, coinsEarned: 0,
          nextMilestone: calcNextMilestone(1),
        };
      }

      const previousStreak = streak.currentStreak;
      const lastDate = streak.lastStudyDate;

      // Đã học hôm nay → idempotent
      if (lastDate && isSameDay(lastDate, today)) {
        return {
          currentStreak: streak.currentStreak, longestStreak: streak.longestStreak,
          previousStreak, isNewDay: false, streakBroken: false, freezeUsed: false,
          milestoneReached: null, gemsEarned: 0, coinsEarned: 0,
          nextMilestone: calcNextMilestone(streak.currentStreak),
        };
      }

      let newStreak = streak.currentStreak;
      let streakBroken = false;
      let freezeUsed = false;

      if (!lastDate || isYesterday(lastDate, today)) {
        newStreak += 1;
      } else {
        if (streak.freezeCount > 0) {
          freezeUsed = true;
          await tx.streakData.update({
            where: { userId },
            data: { freezeCount: { decrement: 1 } },
          });
        } else {
          streakBroken = true;
          if (streak.currentStreak >= 3) {
            await tx.streakHistory.create({
              data: {
                streakDataId: streak.id,
                streakLength: streak.currentStreak,
                startDate: new Date(today.getTime() - streak.currentStreak * 86400000),
                endDate: lastDate!,
                endReason: 'broken',
              },
            });
          }
          newStreak = 1;
        }
      }

      const newLongest = Math.max(streak.longestStreak, newStreak);

      await tx.streakData.update({
        where: { userId },
        data: { currentStreak: newStreak, longestStreak: newLongest, lastStudyDate: today },
      });

      await tx.userDailyActivity.upsert({
        where: { userId_activityDate: { userId, activityDate: today } },
        update: { streakCount: newStreak, freezeUsed },
        create: { userId, activityDate: today, streakCount: newStreak, freezeUsed },
      });

      // Milestone reward (gems + coins)
      let gemsEarned = 0;
      let coinsEarned = 0;
      const milestone = STREAK_MILESTONES[newStreak];
      if (milestone && !streakBroken) {
        gemsEarned = milestone.gems;
        coinsEarned = milestone.coins;

        await tx.userCurrency.update({
          where: { userId },
          data: { gems: { increment: gemsEarned }, coins: { increment: coinsEarned } },
        });
        await tx.currencyTransaction.create({
          data: { userId, currencyType: 'GEMS', amount: gemsEarned,
            reason: 'STREAK_MILESTONE', metadata: { streakDays: newStreak } },
        });
        await tx.currencyTransaction.create({
          data: { userId, currencyType: 'COINS', amount: coinsEarned,
            reason: 'STREAK_MILESTONE', metadata: { streakDays: newStreak } },
        });
      }

      return {
        currentStreak: newStreak, longestStreak: newLongest, previousStreak,
        isNewDay: true, streakBroken, freezeUsed,
        milestoneReached: (milestone && !streakBroken) ? newStreak : null,
        gemsEarned, coinsEarned,
        nextMilestone: calcNextMilestone(newStreak),
      };
    });

    // Check achievements sau transaction (không block main flow)
    this.achievementChecker.check(userId, 'streak', result.currentStreak).catch(() => {});

    // Auto-create feed post for streak milestone (fire and forget)
    if (result.milestoneReached) {
      this.feedService.autoCreatePost(userId, 'STREAK_MILESTONE', {
        streakDays: result.milestoneReached,
      }).catch(() => {});
    }

    return result;
  }
}
