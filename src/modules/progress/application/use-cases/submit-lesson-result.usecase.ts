import { Injectable, Inject } from '@nestjs/common';
import { PROGRESS_TOKENS } from '../../domain/di/tokens';
import type { LessonSubmissionServiceInterface } from '../../domain/services/lesson-submission.service.interface';
import type { MasteryUpdateServiceInterface } from '../../domain/services/mastery-update.service.interface';
import type { SkillProgressServiceInterface } from '../../domain/services/skill-progress.service.interface';
import {
  SubmitLessonResultDto,
  ProgressUpdateResultDto,
} from '../dto/submit-lesson-result.dto';
import { LessonCompletedUseCase } from '../../../gamification/application/use-cases/lesson-completed.usecase';

@Injectable()
export class SubmitLessonResultUseCase {
  constructor(
    @Inject(PROGRESS_TOKENS.LESSON_SUBMISSION_SERVICE)
    private readonly lessonSubmissionService: LessonSubmissionServiceInterface,
    @Inject(PROGRESS_TOKENS.MASTERY_UPDATE_SERVICE)
    private readonly masteryUpdateService: MasteryUpdateServiceInterface,
    @Inject(PROGRESS_TOKENS.SKILL_PROGRESS_SERVICE)
    private readonly skillProgressService: SkillProgressServiceInterface,
    private readonly lessonCompletedUseCase: LessonCompletedUseCase,
  ) {}

  async execute(
    userId: string,
    submitDto: SubmitLessonResultDto,
  ): Promise<ProgressUpdateResultDto> {
    // 1. Check if this is a review lesson
    const isReviewLesson =
      submitDto.lessonId.startsWith('review-') ||
      submitDto.skillId === 'review';

    // 2. Validate lesson progress (skip for review lessons)
    const isValidProgress = isReviewLesson
      ? false
      : await this.lessonSubmissionService.validateLessonProgress(
          userId,
          submitDto.skillId,
          submitDto.lessonId,
        );

    // 3. Get exercise data maps
    const { wordsMap, grammarsMap } =
      await this.lessonSubmissionService.getExerciseDataMaps(
        submitDto.exercises,
      );

    // 4. Calculate performance
    const {
      correctExercises,
      totalExercises,
      lessonAccuracy,
      isLessonSuccessful,
    } = this.lessonSubmissionService.calculateLessonPerformance(
      submitDto.exercises,
    );

    // 5. Save exercise results
    await this.lessonSubmissionService.saveExerciseResults(
      userId,
      submitDto.exercises,
    );

    // 6. Update masteries for correct exercises
    const { wordMasteriesUpdated, grammarMasteriesUpdated } =
      await this.masteryUpdateService.updateMasteries(
        userId,
        submitDto.exercises,
        wordsMap,
        grammarsMap,
      );

    // 7. Generate progress message
    let message = this.skillProgressService.generateProgressMessage(
      correctExercises,
      totalExercises,
      lessonAccuracy,
      wordMasteriesUpdated,
      grammarMasteriesUpdated,
    );

    // 8. Update skill progress if successful and valid (skip for review lessons)
    let skillProgressMessage: string | null = null;
    if (!isReviewLesson && isLessonSuccessful && isValidProgress) {
      skillProgressMessage =
        await this.skillProgressService.updateSkillProgress(
          userId,
          submitDto.skillId,
          submitDto.lessonId,
        );

      if (skillProgressMessage) {
        message += ` ${skillProgressMessage}`;
      }
    }

    // 9. Calculate real XP
    const isPerfect = correctExercises === totalExercises && totalExercises > 0;
    const accuracyPct = Math.round(lessonAccuracy * 100);

    const baseXP = totalExercises * 10; // 10 XP mỗi exercise
    const bonusXP = isLessonSuccessful ? Math.round(accuracyPct * 0.5) : 0; // bonus theo accuracy
    const perfectBonusXP = isPerfect ? 20 : 0; // perfect score bonus
    const totalXpEarned = baseXP + bonusXP + perfectBonusXP;

    // 10. Trigger real gamification (XP + Streak + currency rewards)
    let gamificationResult: any = null;
    if (isLessonSuccessful) {
      gamificationResult = await this.lessonCompletedUseCase
        .execute({
          userId,
          lessonId: submitDto.lessonId,
          lessonType: 'lesson',
          xpEarned: totalXpEarned,
        })
        .catch(() => null); // never fail the main response
    }

    // Build rewards list for UI
    const rewards: { type: string; amount: number; title?: string }[] = [];
    if (gamificationResult) {
      if (gamificationResult.xp.added > 0) {
        rewards.push({
          type: 'XP',
          amount: gamificationResult.xp.added,
          title: 'XP Earned',
        });
      }
      if (gamificationResult.currency.gemsEarned > 0) {
        rewards.push({
          type: 'GEMS',
          amount: gamificationResult.currency.gemsEarned,
          title: 'Gems',
        });
      }
      if (gamificationResult.currency.coinsEarned > 0) {
        rewards.push({
          type: 'COINS',
          amount: gamificationResult.currency.coinsEarned,
          title: 'Coins',
        });
      }
      if (gamificationResult.xp.leveledUp) {
        rewards.push({
          type: 'LEVEL_UP',
          amount: gamificationResult.xp.newLevel,
          title: 'Level Up!',
        });
      }
      if (gamificationResult.streak.milestoneReached) {
        rewards.push({
          type: 'STREAK_MILESTONE',
          amount: gamificationResult.streak.milestoneReached,
          title: '🔥 Streak Milestone',
        });
      }
    }

    return {
      lessonId: submitDto.lessonId,
      skillId: submitDto.skillId,
      totalExercises,
      correctExercises,
      accuracy: accuracyPct,
      wordMasteriesUpdated,
      grammarMasteriesUpdated,
      isLessonSuccessful,
      message,
      // Real XP/gamification data
      xpEarned:
        gamificationResult?.xp.added ??
        (isLessonSuccessful ? totalXpEarned : 0),
      bonuses: { baseXP, bonusXP, perfectBonusXP },
      isPerfect,
      rewards,
      skillProgressMessage,
      streakData: gamificationResult
        ? {
            previousStreak: gamificationResult.streak.previousStreak,
            currentStreak: gamificationResult.streak.currentStreak,
            longestStreak: 0, // pulled from DB if needed
            hasStreakIncreased:
              gamificationResult.streak.currentStreak >
              gamificationResult.streak.previousStreak,
          }
        : null,
    };
  }
}
