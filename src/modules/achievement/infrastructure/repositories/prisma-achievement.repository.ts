import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { RedisService } from '../../../../infrastructure/cache/redis.service';
import type {
  AchievementRepository,
  AchievementDefinition,
  UserAchievementRecord,
} from '../../domain/repositories/achievement.repository.interface';

@Injectable()
export class PrismaAchievementRepository implements AchievementRepository {
  private readonly logger = new Logger(PrismaAchievementRepository.name);
  private readonly DEFS_CACHE_KEY = 'ach:defs';
  private readonly DEFS_CACHE_TTL = 3600; // 1 hour

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async findAllDefinitions(): Promise<AchievementDefinition[]> {
    const cached = await this.redis.get(this.DEFS_CACHE_KEY);
    if (cached) return JSON.parse(cached);

    const achievements = await this.prisma.achievement.findMany({
      orderBy: [{ category: 'asc' }, { tier: 'asc' }],
    });

    await this.redis.set(this.DEFS_CACHE_KEY, JSON.stringify(achievements), this.DEFS_CACHE_TTL);
    return achievements as AchievementDefinition[];
  }

  async findUserAchievements(userId: string): Promise<UserAchievementRecord[]> {
    const cacheKey = `ach:user:${userId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const records = await this.prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
    });

    await this.redis.set(cacheKey, JSON.stringify(records), 300); // 5 min
    return records as unknown as UserAchievementRecord[];
  }

  async upsertProgress(
    userId: string,
    achievementId: string,
    progress: number,
    isUnlocked: boolean,
  ): Promise<{ isUnlocked: boolean; wasAlreadyUnlocked: boolean }> {
    // Check if already unlocked before upsert
    const existing = await this.prisma.userAchievement.findUnique({
      where: { userId_achievementId: { userId, achievementId } },
    });
    const wasAlreadyUnlocked = existing?.isUnlocked === true;

    await this.prisma.userAchievement.upsert({
      where: { userId_achievementId: { userId, achievementId } },
      create: {
        userId,
        achievementId,
        progress,
        isUnlocked,
        unlockedAt: isUnlocked ? new Date() : null,
      },
      update: {
        progress,
        isUnlocked,
        unlockedAt: isUnlocked ? new Date() : undefined,
      },
    });

    return { isUnlocked, wasAlreadyUnlocked };
  }

  async grantRewards(
    userId: string,
    rewardXp: number,
    rewardGems: number,
    achievementName: string,
  ): Promise<void> {
    try {
      const ops: any[] = [];

      if (rewardXp > 0) {
        ops.push(
          this.prisma.user.update({
            where: { id: userId },
            data: {
              xpPoints: { increment: rewardXp },
              totalXpEarned: { increment: rewardXp },
            },
          }),
        );
      }

      if (rewardGems > 0) {
        ops.push(
          this.prisma.userCurrency.update({
            where: { userId },
            data: { gems: { increment: rewardGems } },
          }),
        );
        ops.push(
          this.prisma.currencyTransaction.create({
            data: {
              userId,
              amount: rewardGems,
              currencyType: 'GEMS',
              reason: 'ACHIEVEMENT_REWARD',
              metadata: { achievementName },
            },
          }),
        );
      }

      if (ops.length > 0) {
        await this.prisma.$transaction(ops);
      }
    } catch (error: any) {
      this.logger.error(`Failed to grant achievement rewards: ${error.message}`);
    }
  }

  async invalidateUserCache(userId: string): Promise<void> {
    await this.redis.del(`ach:user:${userId}`);
  }
}
