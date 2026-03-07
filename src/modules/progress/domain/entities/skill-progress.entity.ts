export class SkillProgressEntity {
  constructor(
    public readonly userId: string,
    public readonly skillId: string,
    public readonly levelReached: number,
    public readonly lessonPosition: number,
    public readonly lastPracticed: Date | null,
  ) {}

  get completionPercentage(): number {
    return Math.round((this.levelReached / 7) * 100);
  }
}
