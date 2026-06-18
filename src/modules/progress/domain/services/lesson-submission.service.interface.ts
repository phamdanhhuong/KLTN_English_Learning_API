export interface LessonSubmissionServiceInterface {
  getExerciseDataMaps(exercises: any[]): Promise<{
    wordsMap: Map<string, string[]>;
    grammarsMap: Map<string, string[]>;
  }>;

  calculateLessonPerformance(exercises: any[]): {
    correctExercises: number;
    totalExercises: number;
    lessonAccuracy: number;
    isLessonSuccessful: boolean;
  };

  saveExerciseResults(
    userId: string,
    exercises: any[],
    behaviorData?: any[],
  ): Promise<void>;

  updateLearningProfileAttempts(
    userId: string,
    attemptsCount: number,
  ): Promise<void>;

  validateLessonProgress(
    userId: string,
    skillId: string,
    lessonId: string,
  ): Promise<boolean>;
}
