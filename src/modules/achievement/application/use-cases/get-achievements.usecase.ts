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

    const achievements = await this.prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
      orderBy: { createdAt: 'desc' },
    });

    await this.redis.set(cacheKey, JSON.stringify(achievements), this.CACHE_TTL);

    if (onlyUnlocked) return achievements.filter((a) => a.isUnlocked);
    return achievements;
  }
}

@Injectable()
export class GetAchievementsSummaryUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string) {
    const allAchievements = await this.prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
      orderBy: { createdAt: 'desc' },
    });

    // Separate personal category
    const personal = allAchievements.filter(
      (a) => a.achievement.category.toLowerCase() === 'personal',
    );

    // Other categories: show highest tier per achievement name
    const others = allAchievements.filter(
      (a) => a.achievement.category.toLowerCase() !== 'personal',
    );

    const groupedByName = others.reduce(
      (acc, a) => {
        const name = a.achievement.name;
        if (!acc[name]) acc[name] = [];
        acc[name].push(a);
        return acc;
      },
      {} as Record<string, typeof others>,
    );

    const awards = Object.values(groupedByName).map((group) => {
      group.sort((a, b) => b.achievement.tier - a.achievement.tier);
      return (
        group.find((a) => a.isUnlocked || a.progress > 0) ||
        group[group.length - 1]
      );
    });

    // Stats
    const totalAchievements = await this.prisma.achievement.count();
    const unlockedCount = allAchievements.filter((a) => a.isUnlocked).length;

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
