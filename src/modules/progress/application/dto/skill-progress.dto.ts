export class SkillProgressDto {
  userId: string;
  skillId: string;
  levelReached: number;
  lessonPosition: number;
  lastPracticed: Date | null;
  completionPercentage: number;
}
