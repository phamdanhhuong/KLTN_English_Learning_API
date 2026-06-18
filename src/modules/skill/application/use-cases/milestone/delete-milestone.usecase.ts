import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { SKILL_TOKENS } from '../../../domain/di/tokens';
import { MilestoneRepository } from '../../../domain/repositories/milestone.repository.interface';

@Injectable()
export class DeleteMilestoneUseCase {
  constructor(
    @Inject(SKILL_TOKENS.MILESTONE_REPOSITORY)
    private readonly milestoneRepository: MilestoneRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const existingMilestone = await this.milestoneRepository.findById(id);
    if (!existingMilestone) {
      throw new NotFoundException(`Milestone with ID ${id} not found`);
    }
    await this.milestoneRepository.delete(id);
  }
}
