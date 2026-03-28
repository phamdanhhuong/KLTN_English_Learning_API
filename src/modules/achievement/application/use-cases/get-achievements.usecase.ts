import { Injectable, Inject } from '@nestjs/common';
import { ACHIEVEMENT_TOKENS } from '../../domain/di/tokens';
import type { AchievementRepository } from '../../domain/repositories/achievement.repository.interface';

@Injectable()
export class GetUserAchievementsUseCase {
  constructor(
    @Inject(ACHIEVEMENT_TOKENS.ACHIEVEMENT_REPOSITORY)
    private readonly achievementRepo: AchievementRepository,
  ) {}

  async execute(userId: string, onlyUnlocked = false) {
    const allDefinitions = await this.achievementRepo.findAllDefinitions();
    const userAchievements = await this.achievementRepo.findUserAchievements(userId);

    const userMap = new Map(
      userAchievements.map((ua) => [ua.achievementId, ua]),
    );

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

    if (onlyUnlocked) return merged.filter((a) => a.isUnlocked);
    return merged;
  }
}

@Injectable()
export class GetAchievementsSummaryUseCase {
  constructor(
    @Inject(ACHIEVEMENT_TOKENS.ACHIEVEMENT_REPOSITORY)
    private readonly achievementRepo: AchievementRepository,
  ) {}

  async execute(userId: string) {
    const allDefinitions = await this.achievementRepo.findAllDefinitions();
    const userAchievements = await this.achievementRepo.findUserAchievements(userId);

    const userMap = new Map(
      userAchievements.map((ua) => [ua.achievementId, ua]),
    );

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

    // Gom nhóm các mốc thành tựu (VD: speed_racer_t1, speed_racer_t2) để tránh lặp lại trên UI
    const grouped = new Map<string, any[]>();
    for (const a of allMerged) {
      const baseKey = a.achievement.key.replace(/_t\d+$/, '');
      if (!grouped.has(baseKey)) grouped.set(baseKey, []);
      grouped.get(baseKey)!.push(a);
    }

    const filteredMerged: any[] = [];
    for (const tiers of grouped.values()) {
      tiers.sort((a: any, b: any) => a.achievement.tier - b.achievement.tier);
      // Tìm mốc thấp nhất mà user CHƯA đạt được
      const activeTier = tiers.find((t: any) => !t.isUnlocked) || tiers[tiers.length - 1]; // nếu hoàn thành hết, lấy mốc max
      filteredMerged.push(activeTier);
    }

    const personal = filteredMerged.filter(
      (a: any) => a.achievement.category.toLowerCase() === 'personal',
    );

    const awards = filteredMerged
      .filter((a: any) => a.achievement.category.toLowerCase() !== 'personal')
      .sort((a: any, b: any) => {
        const aScore = a.isUnlocked ? 0 : a.progress > 0 ? 1 : 2;
        const bScore = b.isUnlocked ? 0 : b.progress > 0 ? 1 : 2;
        if (aScore !== bScore) return aScore - bScore;
        const catCmp = a.achievement.category.localeCompare(b.achievement.category);
        if (catCmp !== 0) return catCmp;
        return a.achievement.tier - b.achievement.tier;
      });

    const totalAchievements = allDefinitions.length;
    // Đếm theo toàn bộ mốc chứ không dùng filteredMerged để tiến độ (Progress) trên Header vẫn đúng
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
