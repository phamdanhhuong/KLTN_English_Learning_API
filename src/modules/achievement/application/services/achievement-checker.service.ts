import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { RedisService } from '../../../../infrastructure/cache/redis.service';

/**
 * AchievementChecker — gọi từ các use-cases khác để tự động check và unlock achievements.
 * Không throw error — silent check, không block main flow.
 */
@Injectable()
export class AchievementCheckerService {
  private readonly logger = new Logger(AchievementCheckerService.name);
  private readonly DEFS_CACHE_KEY = 'ach:defs';
  private readonly DEFS_CACHE_TTL = 3600; // 1 hour

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Check tất cả achievements thuộc category với giá trị hiện tại.
   * Gọi từ: AddXpUseCase (category='xp'), UpdateStreakUseCase (category='streak'),
   * LessonCompletedUseCase (category='lessons'), FollowUserUseCase (category='social')
   */
  async check(userId: string, category: string, currentValue: number): Promise<void> {
    try {
      const achievements = await this.getAchievementDefinitions();
      const relevant = achievements.filter(
        (a) => a.category === category && a.requirement <= currentValue,
      );

      if (relevant.length === 0) return;

      for (const achievement of relevant) {
        await this.tryUnlock(userId, achievement, currentValue);
      }
    } catch (error: any) {
      this.logger.error(`Achievement check failed: ${error.message}`);
    }
  }

  private async tryUnlock(
    userId: string,
    achievement: { id: string; requirement: number; rewardXp: number; rewardGems: number; name: string },
    currentValue: number,
  ): Promise<void> {
    const result = await this.prisma.userAchievement.upsert({
      where: {
        userId_achievementId: { userId, achievementId: achievement.id },
      },
      create: {
        userId,
        achievementId: achievement.id,
        progress: currentValue,
        isUnlocked: true,
        unlockedAt: new Date(),
      },
      update: {
        progress: currentValue,
        // Chỉ unlock nếu chưa unlock
        isUnlocked: true,
        unlockedAt: new Date(),
      },
    });

    // Nếu lần đầu unlock → grant rewards
    if (result.isUnlocked) {
      await this.grantRewards(userId, achievement);
      // Invalidate user cache
      await this.redis.del(`ach:user:${userId}`);
    }
  }

  private async grantRewards(
    userId: string,
    achievement: { rewardXp: number; rewardGems: number; name: string },
  ): Promise<void> {
    try {
      const ops: any[] = [];

      if (achievement.rewardXp > 0) {
        ops.push(
          this.prisma.user.update({
            where: { id: userId },
            data: {
              xpPoints: { increment: achievement.rewardXp },
              totalXpEarned: { increment: achievement.rewardXp },
            },
          }),
        );
      }

      if (achievement.rewardGems > 0) {
        ops.push(
          this.prisma.userCurrency.update({
            where: { userId },
            data: { gems: { increment: achievement.rewardGems } },
          }),
        );
        ops.push(
          this.prisma.currencyTransaction.create({
            data: {
              userId,
              amount: achievement.rewardGems,
              currencyType: 'GEMS',
              reason: 'ACHIEVEMENT_REWARD',
              metadata: { achievementName: achievement.name },
            },
          }),
        );
      }

      if (ops.length > 0) {
        await this.prisma.$transaction(ops);
      }

      this.logger.log(`🏆 User ${userId} unlocked: ${achievement.name}`);
    } catch (error: any) {
      this.logger.error(`Failed to grant achievement rewards: ${error.message}`);
    }
  }

  /** Cache achievement definitions từ DB */
  private async getAchievementDefinitions() {
    const cached = await this.redis.get(this.DEFS_CACHE_KEY);
    if (cached) return JSON.parse(cached);

    const achievements = await this.prisma.achievement.findMany({
      orderBy: [{ category: 'asc' }, { tier: 'asc' }],
    });

    await this.redis.set(this.DEFS_CACHE_KEY, JSON.stringify(achievements), this.DEFS_CACHE_TTL);
    return achievements;
  }
}
