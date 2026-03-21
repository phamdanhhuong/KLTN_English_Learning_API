import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { RedisService } from '../../../../infrastructure/cache/redis.service';

@Injectable()
export class GetUserAchievementsUseCase {
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async execute(userId: string, onlyUnlocked = false) {
    const cacheKey = `ach:user:${userId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      const all = JSON.parse(cached);
      if (onlyUnlocked) return all.filter((a: any) => a.isUnlocked);
      return all;
    }

    // Fetch all achievement definitions
    const allDefinitions = await this.prisma.achievement.findMany({
      orderBy: [{ category: 'asc' }, { tier: 'asc' }],
    });

    // Fetch user's progress
    const userAchievements = await this.prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
    });

    // Build a map for quick lookup
    const userMap = new Map(
      userAchievements.map((ua) => [ua.achievementId, ua]),
    );

    // Merge: every definition gets a user record (real or synthetic)
    const merged = allDefinitions.map((def) => {
      const ua = userMap.get(def.id);
      if (ua) return ua;
      return {
        id: `synthetic-${def.id}`,
        userId,
        achievementId: def.id,
        progress: 0,
        isUnlocked: false,
        unlockedAt: null,
        createdAt: def.createdAt,
        updatedAt: def.updatedAt,
        achievement: def,
      };
    });

    await this.redis.set(cacheKey, JSON.stringify(merged), this.CACHE_TTL);

    if (onlyUnlocked) return merged.filter((a) => a.isUnlocked);
    return merged;
  }
}

@Injectable()
export class GetAchievementsSummaryUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string) {
    // Fetch ALL achievement definitions
    const allDefinitions = await this.prisma.achievement.findMany({
      orderBy: [{ category: 'asc' }, { tier: 'asc' }],
    });

    // Fetch user's progress
    const userAchievements = await this.prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
    });

    // Build a map for quick lookup
    const userMap = new Map(
      userAchievements.map((ua) => [ua.achievementId, ua]),
    );

    // Merge: every definition gets a user record (real or synthetic)
    const allMerged = allDefinitions.map((def) => {
      const ua = userMap.get(def.id);
      if (ua) return ua;
      return {
        id: `synthetic-${def.id}`,
        userId,
        achievementId: def.id,
        progress: 0,
        isUnlocked: false,
        unlockedAt: null,
        createdAt: def.createdAt,
        updatedAt: def.updatedAt,
        achievement: def,
      };
    });

    // Separate personal category
    const personal = allMerged.filter(
      (a) => a.achievement.category.toLowerCase() === 'personal',
    );

    // All non-personal achievements sorted by category then tier
    const awards = allMerged
      .filter((a) => a.achievement.category.toLowerCase() !== 'personal')
      .sort((a, b) => {
        // Unlocked first, then in-progress, then locked
        const aScore = a.isUnlocked ? 0 : a.progress > 0 ? 1 : 2;
        const bScore = b.isUnlocked ? 0 : b.progress > 0 ? 1 : 2;
        if (aScore !== bScore) return aScore - bScore;
        // Then by category
        const catCmp = a.achievement.category.localeCompare(b.achievement.category);
        if (catCmp !== 0) return catCmp;
        // Then by tier
        return a.achievement.tier - b.achievement.tier;
      });

    // Stats
    const totalAchievements = allDefinitions.length;
    const unlockedCount = allMerged.filter((a) => a.isUnlocked).length;

    return {
      personal,
      awards,
      stats: {
        total: totalAchievements,
        unlocked: unlockedCount,
        progress: totalAchievements > 0
          ? Math.round((unlockedCount / totalAchievements) * 100)
          : 0,
      },
    };
  }
}
