import { SubmitLessonResultUseCase } from './submit-lesson-result.usecase';

describe('SubmitLessonResultUseCase', () => {
  let useCase: SubmitLessonResultUseCase;
  let lessonSubmissionService: any;
  let masteryUpdateService: any;
  let skillProgressService: any;
  let lessonCompletedUseCase: any;
  let eventEmitter: any;

  beforeEach(() => {
    lessonSubmissionService = {
      validateLessonProgress: jest.fn().mockResolvedValue(true),
      getExerciseDataMaps: jest.fn().mockResolvedValue({
        wordsMap: new Map(), grammarsMap: new Map(),
      }),
      calculateLessonPerformance: jest.fn().mockReturnValue({
        correctExercises: 4, totalExercises: 5, lessonAccuracy: 0.8, isLessonSuccessful: true,
      }),
      saveExerciseResults: jest.fn(),
    };
    masteryUpdateService = {
      updateMasteries: jest.fn().mockResolvedValue({ wordMasteriesUpdated: 2, grammarMasteriesUpdated: 1 }),
    };
    skillProgressService = {
      generateProgressMessage: jest.fn().mockReturnValue('Great job! 4/5 correct.'),
      updateSkillProgress: jest.fn().mockResolvedValue('Level up!'),
    };
    lessonCompletedUseCase = {
      execute: jest.fn().mockResolvedValue({
        xp: { added: 70, leveledUp: false, newLevel: 2 },
        streak: { previousStreak: 3, currentStreak: 4, milestoneReached: null },
        currency: { gemsEarned: 5, coinsEarned: 10 },
      }),
    };
    eventEmitter = { emit: jest.fn() };

    useCase = new SubmitLessonResultUseCase(
      lessonSubmissionService,
      masteryUpdateService,
      skillProgressService,
      lessonCompletedUseCase,
      eventEmitter,
    );
  });

  const submitDto = {
    lessonId: 'lesson-1',
    skillId: 'skill-1',
    exercises: [
      { exerciseId: 'e1', isCorrect: true, incorrectCount: 0 },
      { exerciseId: 'e2', isCorrect: true, incorrectCount: 0 },
      { exerciseId: 'e3', isCorrect: true, incorrectCount: 0 },
      { exerciseId: 'e4', isCorrect: true, incorrectCount: 0 },
      { exerciseId: 'e5', isCorrect: false, incorrectCount: 1 },
    ],
  };

  it('should process lesson submission and return progress result', async () => {
    const result = await useCase.execute('user-1', submitDto);

    expect(result.lessonId).toBe('lesson-1');
    expect(result.correctExercises).toBe(4);
    expect(result.totalExercises).toBe(5);
    expect(result.isLessonSuccessful).toBe(true);
    expect(result.accuracy).toBe(80);
    expect(result.xpEarned).toBe(70);
    expect(lessonSubmissionService.saveExerciseResults).toHaveBeenCalled();
    expect(masteryUpdateService.updateMasteries).toHaveBeenCalled();
    expect(skillProgressService.updateSkillProgress).toHaveBeenCalled();
  });

  it('should skip skill progress update for review lessons', async () => {
    const reviewDto = { ...submitDto, lessonId: 'review-user-1-123', skillId: 'review' };
    const result = await useCase.execute('user-1', reviewDto);

    expect(result.isLessonSuccessful).toBe(true);
    expect(skillProgressService.updateSkillProgress).not.toHaveBeenCalled();
    expect(eventEmitter.emit).toHaveBeenCalledWith('energy.award', expect.objectContaining({ userId: 'user-1' }));
  });

  it('should not trigger gamification for unsuccessful lessons', async () => {
    lessonSubmissionService.calculateLessonPerformance.mockReturnValue({
      correctExercises: 1, totalExercises: 5, lessonAccuracy: 0.2, isLessonSuccessful: false,
    });

    const result = await useCase.execute('user-1', submitDto);
    expect(result.isLessonSuccessful).toBe(false);
    expect(lessonCompletedUseCase.execute).not.toHaveBeenCalled();
  });

  it('should handle gamification failure gracefully', async () => {
    lessonCompletedUseCase.execute.mockRejectedValue(new Error('Gamification error'));

    const result = await useCase.execute('user-1', submitDto);
    expect(result.isLessonSuccessful).toBe(true);
    // Should not throw, gamification failure is caught
  });

  it('should calculate XP bonuses correctly for perfect score', async () => {
    lessonSubmissionService.calculateLessonPerformance.mockReturnValue({
      correctExercises: 5, totalExercises: 5, lessonAccuracy: 1.0, isLessonSuccessful: true,
    });

    const result = await useCase.execute('user-1', submitDto);
    expect(result.isPerfect).toBe(true);
    expect(result.bonuses?.perfectBonusXP).toBe(20);
  });
});
