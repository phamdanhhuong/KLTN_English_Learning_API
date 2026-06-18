import { LearningGoal } from '@prisma/client';
import { Milestone } from './milestone.entity';

export class Roadmap {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly targetGoal: LearningGoal,
    public readonly description: string | null = null,
    public readonly isActive: boolean = true,
    public readonly createdAt: Date = new Date(),
    public readonly milestones?: Milestone[],
  ) {}

  static create(
    title: string,
    targetGoal: LearningGoal,
    description?: string | null,
  ): Roadmap {
    const id = crypto.randomUUID();
    return new Roadmap(id, title, targetGoal, description || null, true);
  }

  update(params: {
    title?: string;
    targetGoal?: LearningGoal;
    description?: string | null;
    isActive?: boolean;
  }): Roadmap {
    return new Roadmap(
      this.id,
      params.title ?? this.title,
      params.targetGoal ?? this.targetGoal,
      params.description !== undefined ? params.description : this.description,
      params.isActive ?? this.isActive,
      this.createdAt,
      this.milestones,
    );
  }
}
