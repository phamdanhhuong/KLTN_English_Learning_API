import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { SKILL_TOKENS } from '../../../domain/di/tokens';
import { RoadmapRepository } from '../../../domain/repositories/roadmap.repository.interface';

@Injectable()
export class GetActiveUserRoadmapUseCase {
  constructor(
    @Inject(SKILL_TOKENS.ROADMAP_REPOSITORY)
    private readonly roadmapRepository: RoadmapRepository,
  ) {}

  async execute(userId: string): Promise<any> {
    const activeRoadmap = await this.roadmapRepository.findActiveUserRoadmap(userId);
    if (!activeRoadmap) {
      throw new NotFoundException(`Active roadmap for user ${userId} not found`);
    }
    return activeRoadmap;
  }
}
