import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma.service';
import { AchievementCheckerService } from '../../../../achievement/application/services/achievement-checker.service';
import { FeedService } from '../../../../feed/application/services/feed.service';
import { LeaderboardService } from '../../../../leaderboard/application/services/leaderboard.service';

export interface AddXpResult {
    newXp: number;
    newLevel: number;
    leveledUp: boolean;
    gemsEarned: number;
    coinsEarned: number;
}

// Level thresholds (cached in memory — data tĩnh)
const LEVEL_XP_THRESHOLDS = [
    { level: 1, minXp: 0, maxXp: 100 },
    { level: 2, minXp: 100, maxXp: 250 },
    { level: 3, minXp: 250, maxXp: 500 },
    { level: 4, minXp: 500, maxXp: 850 },
    { level: 5, minXp: 850, maxXp: 1300 },
    { level: 6, minXp: 1300, maxXp: 1850 },
    { level: 7, minXp: 1850, maxXp: 2500 },
    { level: 8, minXp: 2500, maxXp: 3250 },
    { level: 9, minXp: 3250, maxXp: 4100 },
    { level: 10, minXp: 4100, maxXp: 5100 },
    { level: 11, minXp: 5100, maxXp: 6300 },
    { level: 12, minXp: 6300, maxXp: 7700 },
    { level: 13, minXp: 7700, maxXp: 9300 },
    { level: 14, minXp: 9300, maxXp: 11100 },
    { level: 15, minXp: 11100, maxXp: 99999 },
];

const LEVEL_REWARDS: Record<number, { gems: number; coins: number }> = {
    2: { gems: 10, coins: 100 },
    3: { gems: 15, coins: 150 },
    4: { gems: 20, coins: 200 },
    5: { gems: 25, coins: 250 },
    6: { gems: 30, coins: 300 },
    7: { gems: 40, coins: 400 },
    8: { gems: 50, coins: 500 },
    9: { gems: 60, coins: 600 },
    10: { gems: 75, coins: 750 },
    11: { gems: 90, coins: 900 },
    12: { gems: 110, coins: 1100 },
    13: { gems: 130, coins: 1300 },
    14: { gems: 150, coins: 1500 },
    15: { gems: 200, coins: 2000 },
};

function calculateLevel(xp: number): number {
    for (let i = LEVEL_XP_THRESHOLDS.length - 1; i >= 0; i--) {
        if (xp >= LEVEL_XP_THRESHOLDS[i].minXp) {
            return LEVEL_XP_THRESHOLDS[i].level;
        }
    }
    return 1;
}

function getToday(): Date {
    const now = new Date();
    // Vietnam timezone (UTC+7)
    const vnNow = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    return new Date(
        Date.UTC(vnNow.getUTCFullYear(), vnNow.getUTCMonth(), vnNow.getUTCDate()),
    );
}

@Injectable()
export class AddXpUseCase {
    constructor(
        private readonly prisma: PrismaService,
        private readonly achievementChecker: AchievementCheckerService,
        private readonly feedService: FeedService,
        private readonly leaderboardService: LeaderboardService,
    ) { }

    async execute(
        userId: string,
        xpAmount: number,
        source: 'lesson' | 'exercise' | 'streak' | 'quest' | 'achievement' = 'lesson',
    ): Promise<AddXpResult> {
        if (xpAmount <= 0) {
            throw new Error('XP amount must be positive');
        }

        const today = getToday();

        const result = await this.prisma.$transaction(async (tx) => {
            // 1. Lấy user hiện tại
            const user = await tx.user.findUniqueOrThrow({
                where: { id: userId },
                select: { xpPoints: true, currentLevel: true },
            });

            const newXp = user.xpPoints + xpAmount;
            const newLevel = calculateLevel(newXp);
            const leveledUp = newLevel > user.currentLevel;

            // 2. Update XP + Level trên User
            await tx.user.update({
                where: { id: userId },
                data: {
                    xpPoints: newXp,
                    totalXpEarned: { increment: xpAmount },
                    currentLevel: newLevel,
                },
            });

            // 3. Upsert DailyActivity (cộng dồn XP hôm nay)
            const activityUpdate: any = { xpEarned: { increment: xpAmount } };
            if (source === 'lesson') activityUpdate.lessonsCount = { increment: 1 };
            if (source === 'exercise') activityUpdate.exerciseCount = { increment: 1 };

            await tx.userDailyActivity.upsert({
                where: { userId_activityDate: { userId, activityDate: today } },
                update: activityUpdate,
                create: {
                    userId,
                    activityDate: today,
                    xpEarned: xpAmount,
                    lessonsCount: source === 'lesson' ? 1 : 0,
                    exerciseCount: source === 'exercise' ? 1 : 0,
                },
            });

            let gemsEarned = 0;
            let coinsEarned = 0;

            // 4. Nếu level up — thưởng currency (atomic)
            if (leveledUp) {
                for (let lvl = user.currentLevel + 1; lvl <= newLevel; lvl++) {
                    const reward = LEVEL_REWARDS[lvl];
                    if (!reward) continue;
                    gemsEarned += reward.gems;
                    coinsEarned += reward.coins;
                }

                if (gemsEarned > 0 || coinsEarned > 0) {
                    await tx.userCurrency.update({
                        where: { userId },
                        data: {
                            gems: { increment: gemsEarned },
                            coins: { increment: coinsEarned },
                        },
                    });

                    if (gemsEarned > 0) {
                        await tx.currencyTransaction.create({
                            data: {
                                userId,
                                currencyType: 'GEMS',
                                amount: gemsEarned,
                                reason: 'LEVEL_UP_REWARD',
                                metadata: { fromLevel: user.currentLevel, toLevel: newLevel },
                            },
                        });
                    }
                    if (coinsEarned > 0) {
                        await tx.currencyTransaction.create({
                            data: {
                                userId,
                                currencyType: 'COINS',
                                amount: coinsEarned,
                                reason: 'LEVEL_UP_REWARD',
                                metadata: { fromLevel: user.currentLevel, toLevel: newLevel },
                            },
                        });
                    }
                }
            }

            return { newXp, newLevel, leveledUp, gemsEarned, coinsEarned };
        });

        // Check achievements sau transaction (không block main flow)
        this.achievementChecker.check(userId, 'xp', result.newXp).catch(() => {});

        // Auto-create feed posts (fire and forget)
        if (result.leveledUp) {
            this.feedService.autoCreatePost(userId, 'LEVEL_UP', { newLevel: result.newLevel }).catch(() => {});
        }
        // XP milestone check
        this.feedService.autoCreatePost(userId, 'XP_MILESTONE', { totalXp: result.newXp }).catch(() => {});

        // Update leaderboard XP (auto-joins league if needed)
        this.leaderboardService.updateUserXp(userId, xpAmount).catch(() => {});

        return result;
    }
}
