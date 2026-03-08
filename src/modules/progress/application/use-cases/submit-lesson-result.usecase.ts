import { Injectable, Inject } from '@nestjs/common';
import { PROGRESS_TOKENS } from '../../domain/di/tokens';
import type { LessonSubmissionServiceInterface } from '../../domain/services/lesson-submission.service.interface';
import type { MasteryUpdateServiceInterface } from '../../domain/services/mastery-update.service.interface';
import type { SkillProgressServiceInterface } from '../../domain/services/skill-progress.service.interface';
import {
  SubmitLessonResultDto,
  ProgressUpdateResultDto,
} from '../dto/submit-lesson-result.dto';

@Injectable()
export class SubmitLessonResultUseCase {
  constructor(
    @Inject(PROGRESS_TOKENS.LESSON_SUBMISSION_SERVICE)
    private readonly lessonSubmissionService: LessonSubmissionServiceInterface,
    @Inject(PROGRESS_TOKENS.MASTERY_UPDATE_SERVICE)
    private readonly masteryUpdateService: MasteryUpdateServiceInterface,
    @Inject(PROGRESS_TOKENS.SKILL_PROGRESS_SERVICE)
    private readonly skillProgressService: SkillProgressServiceInterface,
  ) {}

  async execute(
    userId: string,
    submitDto: SubmitLessonResultDto,
  ): Promise<ProgressUpdateResultDto> {
    // 1. Validate lesson progress
    const isValidProgress =
      await this.lessonSubmissionService.validateLessonProgress(
        userId,
        submitDto.skillId,
        submitDto.lessonId,
      );

    // 2. Get exercise data maps
    const { wordsMap, grammarsMap } =
      await this.lessonSubmissionService.getExerciseDataMaps(
        submitDto.exercises,
      );

    // 3. Calculate performance
    const { correctExercises, totalExercises, lessonAccuracy, isLessonSuccessful } =
      this.lessonSubmissionService.calculateLessonPerformance(
        submitDto.exercises,
      );

    // 4. Save exercise results
    await this.lessonSubmissionService.saveExerciseResults(
      userId,
      submitDto.exercises,
    );

    // 5. Update masteries for correct exercises
    const { wordMasteriesUpdated, grammarMasteriesUpdated } =
      await this.masteryUpdateService.updateMasteries(
        userId,
        submitDto.exercises,
        wordsMap,
        grammarsMap,
      );

    // 6. Generate progress message
    let message = this.skillProgressService.generateProgressMessage(
      correctExercises,
      totalExercises,
      lessonAccuracy,
      wordMasteriesUpdated,
      grammarMasteriesUpdated,
    );

    // 7. Update skill progress if successful and valid
    let skillProgressMessage: string | null = null;
    if (isLessonSuccessful && isValidProgress) {
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

    // 8. Build response with fake data for skipped fields
    const isPerfect = correctExercises === totalExercises && totalExercises > 0;

    return {
      lessonId: submitDto.lessonId,
      skillId: submitDto.skillId,
      totalExercises,
      correctExercises,
      accuracy: Math.round(lessonAccuracy * 100),
      wordMasteriesUpdated,
      grammarMasteriesUpdated,
      isLessonSuccessful,
      message,
      // Fake XP/rewards data (skipped calc)
      xpEarned: 0,
      bonuses: { baseXP: 0, bonusXP: 0, perfectBonusXP: 0 },
      isPerfect,
      rewards: [],
      skillProgressMessage,
      streakData: null,
    };
  }
}
