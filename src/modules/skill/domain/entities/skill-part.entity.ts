import { Skill } from './skill.entity';

export class SkillPart {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description?: string,
    public readonly position: number = 0,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
    public readonly skills?: Skill[],
  ) {}

  static create(
    name: string,
    description?: string,
    position?: number,
  ): SkillPart {
    const id = crypto.randomUUID();
    return new SkillPart(id, name, description, position);
  }

  updateName(newName: string): SkillPart {
    return new SkillPart(
      this.id,
      newName,
      this.description,
      this.position,
      this.createdAt,
      new Date(),
      this.skills,
    );
  }

  updateDescription(newDescription: string): SkillPart {
    return new SkillPart(
      this.id,
      this.name,
      newDescription,
      this.position,
      this.createdAt,
      new Date(),
      this.skills,
    );
  }

  updatePosition(newPosition: number): SkillPart {
    return new SkillPart(
      this.id,
      this.name,
      this.description,
      newPosition,
      this.createdAt,
      new Date(),
      this.skills,
    );
  }
}
