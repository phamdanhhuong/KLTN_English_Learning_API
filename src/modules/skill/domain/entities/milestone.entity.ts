import { ProficiencyLevel } from '@prisma/client';
import { Roadmap } from './roadmap.entity';

export class Milestone {
  constructor(
    public readonly id: string,
    public readonly roadmapId: string,
    public readonly title: string,
    public readonly targetLevel: ProficiencyLevel,
    public readonly order: number = 0,
    public readonly capstoneTestId: string | null = null,
    public readonly roadmap?: Roadmap,
  ) {}

  static create(
    roadmapId: string,
    title: string,
    targetLevel: ProficiencyLevel,
    order?: number,
    capstoneTestId?: string | null,
  ): Milestone {
    const id = crypto.randomUUID();
    return new Milestone(id, roadmapId, title, targetLevel, order ?? 0, capstoneTestId || null);
  }

  update(params: {
    title?: string;
    targetLevel?: ProficiencyLevel;
    order?: number;
    capstoneTestId?: string | null;
  }): Milestone {
    return new Milestone(
      this.id,
      this.roadmapId,
      params.title ?? this.title,
      params.targetLevel ?? this.targetLevel,
      params.order ?? this.order,
      params.capstoneTestId !== undefined ? params.capstoneTestId : this.capstoneTestId,
      this.roadmap,
    );
  }
}
