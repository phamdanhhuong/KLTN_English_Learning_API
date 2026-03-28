import { Injectable, Inject, Logger } from '@nestjs/common';
import { ACHIEVEMENT_TOKENS } from '../../domain/di/tokens';
import type { AchievementRepository } from '../../domain/repositories/achievement.repository.interface';
import { FeedService } from '../../../feed/application/services/feed.service';

/**
 * AchievementChecker — gọi từ các use-cases khác để tự động check và unlock achievements.
 * Không throw error — silent check, không block main flow.
 */
@Injectable()
export class AchievementCheckerService {
  private readonly logger = new Logger(AchievementCheckerService.name);

  constructor(
    @Inject(ACHIEVEMENT_TOKENS.ACHIEVEMENT_REPOSITORY)
    private readonly achievementRepo: AchievementRepository,
    private readonly feedService: FeedService,
  ) {}

  /**
   * Check tất cả achievements thuộc category với giá trị hiện tại.
   * Gọi từ: AddXpUseCase (category='xp'), UpdateStreakUseCase (category='streak'),
   * LessonCompletedUseCase (category='lessons'), FollowUserUseCase (category='social')
   */
  async check(userId: string, category: string, currentValue: number): Promise<void> {
    try {
      const achievements = await this.achievementRepo.findAllDefinitions();
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
    const result = await this.achievementRepo.upsertProgress(
      userId,
      achievement.id,
      currentValue,
      true,
    );

    // Chỉ grant rewards nếu lần đầu unlock
    if (result.isUnlocked && !result.wasAlreadyUnlocked) {
      await this.achievementRepo.grantRewards(
        userId,
        achievement.rewardXp,
        achievement.rewardGems,
        achievement.name,
      );
      await this.achievementRepo.invalidateUserCache(userId);
      this.logger.log(`🏆 User ${userId} unlocked: ${achievement.name}`);

      // Feed auto-create: ACHIEVEMENT_UNLOCKED
      this.feedService.autoCreatePost(userId, 'ACHIEVEMENT_UNLOCKED', {
        achievementName: achievement.name,
        tier: (achievement as any).tier ?? 0,
      }).catch(() => {});
    }
  }
}
