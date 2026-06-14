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
  async check(
    userId: string,
    category: string,
    currentValue: number,
  ): Promise<void> {
    try {
      const achievements = await this.achievementRepo.findAllDefinitions();
      const relevant = achievements.filter((a) => a.category === category);

      if (relevant.length === 0) return;

      for (const achievement of relevant) {
        const isUnlocked = currentValue >= achievement.requirement;
        await this.tryUnlock(userId, achievement, currentValue, isUnlocked);
      }
    } catch (error: any) {
      this.logger.error(`Achievement check failed: ${error.message}`);
    }
  }

  /**
   * Cập nhật Kỷ Lục Cá Nhân (Personal Records).
   * So sánh giá trị hiện tại trong DB, nếu newValue "tốt hơn" (cao hơn hoặc thấp hơn tuỳ isMin) thì lưu đè.
   */
  async updatePersonalRecord(
    userId: string,
    recordKey: string,
    newValue: number,
    isMin = false,
  ): Promise<void> {
    try {
      const achievements = await this.achievementRepo.findAllDefinitions();
      const recordDef = achievements.find(
        (a) => a.key === recordKey && a.category === 'personal',
      );
      if (!recordDef) return;

      const userAchievements =
        await this.achievementRepo.findUserAchievements(userId);
      const currentRecord = userAchievements.find(
        (ua) => ua.achievementId === recordDef.id,
      );

      const currentVal = currentRecord?.progress ?? (isMin ? Infinity : 0);

      const isNewRecord = isMin ? newValue < currentVal : newValue > currentVal;

      if (isNewRecord) {
        await this.achievementRepo.upsertProgress(
          userId,
          recordDef.id,
          newValue,
          true,
        );
        await this.achievementRepo.invalidateUserCache(userId);
        this.logger.log(
          `🌟 User ${userId} broke personal record [${recordKey}] with ${newValue}`,
        );

        // Feed auto-create: PERSONAL_RECORD_BROKEN
        this.feedService
          .autoCreatePost(userId, 'PERSONAL_RECORD_BROKEN', {
            recordName: recordDef.name,
            value: newValue,
          })
          .catch(() => {});
      }
    } catch (error: any) {
      this.logger.error(`Personal record update failed: ${error.message}`);
    }
  }

  private async tryUnlock(
    userId: string,
    achievement: {
      id: string;
      requirement: number;
      rewardXp: number;
      rewardGems: number;
      name: string;
    },
    currentValue: number,
    isUnlocked: boolean,
  ): Promise<void> {
    const result = await this.achievementRepo.upsertProgress(
      userId,
      achievement.id,
      currentValue,
      isUnlocked,
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
      this.feedService
        .autoCreatePost(userId, 'ACHIEVEMENT_UNLOCKED', {
          achievementName: achievement.name,
          tier: (achievement as any).tier ?? 0,
        })
        .catch(() => {});
    }
  }
}
