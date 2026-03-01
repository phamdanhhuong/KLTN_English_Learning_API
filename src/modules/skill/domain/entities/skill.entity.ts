import { SkillLevel } from './skill-level.entity';

export class Skill {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly description?: string,
    public readonly position: number = 0,
    public readonly partId?: string,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
    public readonly skillLevels?: SkillLevel[],
  ) {}

  static create(
    title: string,
    description?: string,
    position?: number,
    partId?: string,
  ): Skill {
    const id = crypto.randomUUID();
    return new Skill(id, title, description, position, partId);
  }

  updateTitle(newTitle: string): Skill {
    return new Skill(
      this.id,
      newTitle,
      this.description,
      this.position,
      this.partId,
      this.createdAt,
      new Date(),
      this.skillLevels,
    );
  }

  updateDescription(newDescription: string): Skill {
    return new Skill(
      this.id,
      this.title,
      newDescription,
      this.position,
      this.partId,
      this.createdAt,
      new Date(),
      this.skillLevels,
    );
  }

  updatePosition(newPosition: number): Skill {
    return new Skill(
      this.id,
      this.title,
      this.description,
      newPosition,
      this.partId,
      this.createdAt,
      new Date(),
      this.skillLevels,
    );
  }

  updatePartId(newPartId?: string): Skill {
    return new Skill(
      this.id,
      this.title,
      this.description,
      this.position,
      newPartId,
      this.createdAt,
      new Date(),
      this.skillLevels,
    );
  }
}
