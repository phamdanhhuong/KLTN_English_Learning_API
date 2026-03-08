export interface SkillProgressServiceInterface {
  updateSkillProgress(
    userId: string,
    skillId: string,
    completedLessonId: string,
  ): Promise<string | null>;

  generateProgressMessage(
    correctExercises: number,
    totalExercises: number,
    lessonAccuracy: number,
    wordMasteriesUpdated: number,
    grammarMasteriesUpdated: number,
  ): string;
}
