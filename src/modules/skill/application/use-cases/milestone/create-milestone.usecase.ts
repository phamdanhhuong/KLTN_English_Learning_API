import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { SKILL_TOKENS } from '../../../domain/di/tokens';
import { MilestoneRepository } from '../../../domain/repositories/milestone.repository.interface';
import { RoadmapRepository } from '../../../domain/repositories/roadmap.repository.interface';
import { Milestone } from '../../../domain/entities/milestone.entity';
import { CreateMilestoneDto, MilestoneDto } from '../../dto/milestone.dto';
import { MilestoneMapper } from '../../mappers/milestone.mapper';

@Injectable()
export class CreateMilestoneUseCase {
  constructor(
    @Inject(SKILL_TOKENS.MILESTONE_REPOSITORY)
    private readonly milestoneRepository: MilestoneRepository,
    @Inject(SKILL_TOKENS.ROADMAP_REPOSITORY)
    private readonly roadmapRepository: RoadmapRepository,
  ) {}

  async execute(dto: CreateMilestoneDto): Promise<MilestoneDto> {
    const roadmap = await this.roadmapRepository.findById(dto.roadmapId);
    if (!roadmap) {
      throw new NotFoundException(`Roadmap with ID ${dto.roadmapId} not found`);
    }

    const milestone = Milestone.create(
      dto.roadmapId,
      dto.title,
      dto.targetLevel,
      dto.order,
      dto.capstoneTestId,
    );
    const created = await this.milestoneRepository.create(milestone);
    return MilestoneMapper.toDto(created);
  }
}
