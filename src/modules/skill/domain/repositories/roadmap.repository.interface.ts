import { Roadmap } from '../entities/roadmap.entity';

export interface RoadmapRepository {
  findAll(): Promise<Roadmap[]>;
  findById(id: string): Promise<Roadmap | null>;
  create(roadmap: Roadmap): Promise<Roadmap>;
  update(roadmap: Roadmap): Promise<Roadmap>;
  delete(id: string): Promise<void>;
  findActiveUserRoadmap(userId: string): Promise<any | null>;
}
