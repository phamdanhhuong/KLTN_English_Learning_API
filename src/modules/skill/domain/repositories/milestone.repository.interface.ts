import { Milestone } from '../entities/milestone.entity';

export interface MilestoneRepository {
  findAllByRoadmapId(roadmapId: string): Promise<Milestone[]>;
  findById(id: string): Promise<Milestone | null>;
  create(milestone: Milestone): Promise<Milestone>;
  update(milestone: Milestone): Promise<Milestone>;
  delete(id: string): Promise<void>;
}
