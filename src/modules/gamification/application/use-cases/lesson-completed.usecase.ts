import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { AddXpUseCase } from './xp/add-xp.usecase';
import { UpdateStreakUseCase } from './streak/update-streak.usecase';
import { QuestService } from '../../../quest/application/services/quest.service';
import { AchievementCheckerService } from '../../../achievement/application/services/achievement-checker.service';

export interface LessonCompletedDto {
  userId: string;
  lessonId: string;
  lessonType: string;
  xpEarned: number;
  gemsEarned?: number;
  coinsEarned?: number;
  isPerfect?: boolean;
  exerciseCount?: number;
  timeSpent?: number;
}

export interface LessonCompletionSummary {
  xp: { added: number; newTotal: number; newLevel: number; leveledUp: boolean };
  streak: {
    currentStreak: number;
    previousStreak: number;
    streakBroken: boolean;
    milestoneReached: number | null;
  };
  currency: { gemsEarned: number; coinsEarned: number };
}

@Injectable()
export class LessonCompletedUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly addXpUseCase: AddXpUseCase,
    private readonly updateStreakUseCase: UpdateStreakUseCase,
    private readonly questService: QuestService,
    private readonly achievementChecker: AchievementCheckerService,
  ) {}

  async execute(dto: LessonCompletedDto): Promise<LessonCompletionSummary> {
    // Chạy XP và Streak song song (mỗi cái đã có transaction riêng)
    const [xpResult, streakResult] = await Promise.all([
      this.addXpUseCase.execute(dto.userId, dto.xpEarned, 'lesson'),
      this.updateStreakUseCase.execute(dto.userId),
    ]);

    // Thêm currency bonus từ bài học (nếu có)
    let totalGemsEarned = xpResult.gemsEarned + (dto.gemsEarned ?? 0);
    let totalCoinsEarned = dto.coinsEarned ?? 0;

    if ((dto.gemsEarned ?? 0) > 0 || (dto.coinsEarned ?? 0) > 0) {
      await this.prisma.$transaction(async (tx) => {
        await tx.userCurrency.update({
          where: { userId: dto.userId },
          data: {
            ...(dto.gemsEarned ? { gems: { increment: dto.gemsEarned } } : {}),
            ...(dto.coinsEarned
              ? { coins: { increment: dto.coinsEarned } }
              : {}),
          },
        });
        if (dto.gemsEarned) {
          await tx.currencyTransaction.create({
            data: {
              userId: dto.userId,
              currencyType: 'GEMS',
              amount: dto.gemsEarned,
              reason: 'LESSON_COMPLETED',
              metadata: { lessonId: dto.lessonId, lessonType: dto.lessonType },
            },
          });
        }
        if (dto.coinsEarned) {
          await tx.currencyTransaction.create({
            data: {
              userId: dto.userId,
              currencyType: 'COINS',
              amount: dto.coinsEarned,
              reason: 'LESSON_COMPLETED',
              metadata: { lessonId: dto.lessonId, lessonType: dto.lessonType },
            },
          });
        }
      });
    }

    // Cộng thêm gems từ streak milestone vào tổng
    totalGemsEarned += streakResult.gemsEarned;
    totalCoinsEarned += streakResult.coinsEarned;

    // Fire-and-forget: update friends quest contribution
    this.questService
      .updateFriendsQuestContribution(dto.userId, dto.xpEarned)
      .catch(() => {});

    // Fire-and-forget: init + update daily quest progress
    this.questService
      .checkAndInitQuests(dto.userId)
      .then(() =>
        Promise.all([
          this.questService.updateQuestProgress(dto.userId, 'LESSONS', 1),
          this.questService.updateQuestProgress(
            dto.userId,
            'XP_EARNED',
            dto.xpEarned,
          ),
          // Exercise count quest
          dto.exerciseCount
            ? this.questService.updateQuestProgress(
                dto.userId,
                'EXERCISES',
                dto.exerciseCount,
              )
            : Promise.resolve(),
          // Perfectionist quest — only count when isPerfect
          dto.isPerfect
            ? this.questService.updateQuestByKey(
                dto.userId,
                'challenge_perfectionist',
                1,
              )
            : Promise.resolve(),
        ]),
      )
      .catch(() => {});

    // Fire-and-forget: Track gamification stats and achievements
    this.trackGamificationStats(dto).catch(() => {});

    return {
      xp: {
        added: dto.xpEarned,
        newTotal: xpResult.newXp,
        newLevel: xpResult.newLevel,
        leveledUp: xpResult.leveledUp,
      },
      streak: {
        currentStreak: streakResult.currentStreak,
        previousStreak: streakResult.previousStreak,
        streakBroken: streakResult.streakBroken,
        milestoneReached: streakResult.milestoneReached,
      },
      currency: { gemsEarned: totalGemsEarned, coinsEarned: totalCoinsEarned },
    };
  }

  private async trackGamificationStats(dto: LessonCompletedDto): Promise<void> {
    const {
      userId,
      lessonType,
      exerciseCount,
      isPerfect,
      timeSpent,
      xpEarned,
    } = dto;

    // 1. Update Personal Records
    await Promise.all([
      this.achievementChecker.updatePersonalRecord(userId, 'most_xp', xpEarned),
      // Track most lessons in a day using UserDailyActivity which is already updated by AddXpUseCase
      this.prisma.userDailyActivity
        .findUnique({
          where: {
            userId_activityDate: {
              userId,
              activityDate: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        })
        .then((activity) => {
          if (activity) {
            return this.achievementChecker.updatePersonalRecord(
              userId,
              'most_lessons_in_day',
              activity.lessonsCount,
            );
          }
        }),
    ]);

    // 2. Fetch or create UserGamificationStats
    let stats = await this.prisma.userGamificationStats.findUnique({
      where: { userId },
    });
    if (!stats) {
      stats = await this.prisma.userGamificationStats.create({
        data: { userId },
      });
    }

    const updateData: any = {};
    let shouldUpdate = false;

    // 3. Process Review lessons
    if (lessonType === 'review' && exerciseCount) {
      // For review lessons, we track mistakes corrected
      this.achievementChecker
        .check(userId, 'mistake_correction_count', exerciseCount)
        .catch(() => {});
    }

    // 4. Process Perfect lessons
    if (isPerfect) {
      updateData.perfectLessonCount = { increment: 1 };
      updateData.perfectLessonStreak = { increment: 1 };
      shouldUpdate = true;

      const newStreak = stats.perfectLessonStreak + 1;
      const newCount = stats.perfectLessonCount + 1;

      // Track personal records for perfect lessons
      this.achievementChecker
        .updatePersonalRecord(userId, 'perfect_lessons', newCount)
        .catch(() => {});
      this.achievementChecker
        .updatePersonalRecord(userId, 'most_perfect_in_row', newStreak)
        .catch(() => {});

      if (timeSpent) {
        this.achievementChecker
          .updatePersonalRecord(
            userId,
            'fastest_perfect_lesson',
            timeSpent,
            true,
          )
          .catch(() => {});
      }

      this.achievementChecker
        .check(userId, 'perfect_lesson_count', newCount)
        .catch(() => {});
      this.achievementChecker
        .check(userId, 'perfect_lesson_streak', newStreak)
        .catch(() => {});
    } else {
      if (stats.perfectLessonStreak > 0) {
        updateData.perfectLessonStreak = 0; // Reset streak
        shouldUpdate = true;
      }
    }

    // 5. Process Fast lessons (e.g. < 120 seconds)
    if (timeSpent && timeSpent < 120) {
      updateData.fastLessonCount = { increment: 1 };
      shouldUpdate = true;
      const newFastCount = stats.fastLessonCount + 1;
      this.achievementChecker
        .check(userId, 'fast_lesson_count', newFastCount)
        .catch(() => {});
    }

    // 6. Save stats if changed
    if (shouldUpdate) {
      await this.prisma.userGamificationStats.update({
        where: { userId },
        data: updateData,
      });
    }

    // 7. Time-based achievements
    const currentHour = new Date().getHours();
    if (currentHour < 8) {
      this.achievementChecker.check(userId, 'early_riser', 1).catch(() => {});
    } else if (currentHour >= 22) {
      this.achievementChecker.check(userId, 'sleepwalker', 1).catch(() => {});
    }
  }
}
