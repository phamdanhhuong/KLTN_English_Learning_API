export class UserCustomSkill {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly skillId: string,
    public readonly createdAt: Date = new Date(),
  ) {}

  static create(userId: string, skillId: string): UserCustomSkill {
    const id = crypto.randomUUID();
    return new UserCustomSkill(id, userId, skillId);
  }
}
