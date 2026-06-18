import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { SKILL_TOKENS } from '../../../domain/di/tokens';
import { MilestoneRepository } from '../../../domain/repositories/milestone.repository.interface';
import { MilestoneDto } from '../../dto/milestone.dto';
import { MilestoneMapper } from '../../mappers/milestone.mapper';

@Injectable()
export class GetMilestoneByIdUseCase {
  constructor(
    @Inject(SKILL_TOKENS.MILESTONE_REPOSITORY)
    private readonly milestoneRepository: MilestoneRepository,
  ) {}

  async execute(id: string): Promise<MilestoneDto> {
    const milestone = await this.milestoneRepository.findById(id);
    if (!milestone) {
      throw new NotFoundException(`Milestone with ID ${id} not found`);
    }
    return MilestoneMapper.toDto(milestone);
  }
}
