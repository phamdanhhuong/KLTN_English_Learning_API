import { Injectable, Inject } from '@nestjs/common';
import { SKILL_TOKENS } from '../../../domain/di/tokens';
import { MilestoneRepository } from '../../../domain/repositories/milestone.repository.interface';
import { MilestoneDto } from '../../dto/milestone.dto';
import { MilestoneMapper } from '../../mappers/milestone.mapper';

@Injectable()
export class GetMilestonesByRoadmapUseCase {
  constructor(
    @Inject(SKILL_TOKENS.MILESTONE_REPOSITORY)
    private readonly milestoneRepository: MilestoneRepository,
  ) {}

  async execute(roadmapId: string): Promise<MilestoneDto[]> {
    const milestones = await this.milestoneRepository.findAllByRoadmapId(roadmapId);
    return milestones.map((m) => MilestoneMapper.toDto(m));
  }
}
