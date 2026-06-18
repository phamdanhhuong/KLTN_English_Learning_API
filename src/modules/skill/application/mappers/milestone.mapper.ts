import { Milestone } from '../../domain/entities/milestone.entity';
import { MilestoneDto } from '../dto/milestone.dto';

export class MilestoneMapper {
  static toDto(milestone: Milestone): MilestoneDto {
    return {
      id: milestone.id,
      roadmapId: milestone.roadmapId,
      title: milestone.title,
      targetLevel: milestone.targetLevel,
      order: milestone.order,
      capstoneTestId: milestone.capstoneTestId,
    };
  }
}
