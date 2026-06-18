import { Roadmap } from '../../domain/entities/roadmap.entity';
import { RoadmapDto } from '../dto/roadmap.dto';
import { MilestoneMapper } from './milestone.mapper';

export class RoadmapMapper {
  static toDto(roadmap: Roadmap): RoadmapDto {
    return {
      id: roadmap.id,
      title: roadmap.title,
      targetGoal: roadmap.targetGoal,
      description: roadmap.description,
      isActive: roadmap.isActive,
      createdAt: roadmap.createdAt,
      milestones: roadmap.milestones
        ? roadmap.milestones.map((m) => MilestoneMapper.toDto(m))
        : undefined,
    };
  }
}
