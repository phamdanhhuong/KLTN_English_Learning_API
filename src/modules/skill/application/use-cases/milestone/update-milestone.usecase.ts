import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { SKILL_TOKENS } from '../../../domain/di/tokens';
import { MilestoneRepository } from '../../../domain/repositories/milestone.repository.interface';
import { UpdateMilestoneDto, MilestoneDto } from '../../dto/milestone.dto';
import { MilestoneMapper } from '../../mappers/milestone.mapper';

@Injectable()
export class UpdateMilestoneUseCase {
  constructor(
    @Inject(SKILL_TOKENS.MILESTONE_REPOSITORY)
    private readonly milestoneRepository: MilestoneRepository,
  ) {}

  async execute(id: string, dto: UpdateMilestoneDto): Promise<MilestoneDto> {
    const existingMilestone = await this.milestoneRepository.findById(id);
    if (!existingMilestone) {
      throw new NotFoundException(`Milestone with ID ${id} not found`);
    }

    const updatedMilestone = existingMilestone.update(dto);
    const saved = await this.milestoneRepository.update(updatedMilestone);
    return MilestoneMapper.toDto(saved);
  }
}
