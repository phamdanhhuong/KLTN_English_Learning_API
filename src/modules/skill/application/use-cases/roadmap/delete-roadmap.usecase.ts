import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { SKILL_TOKENS } from '../../../domain/di/tokens';
import { RoadmapRepository } from '../../../domain/repositories/roadmap.repository.interface';

@Injectable()
export class DeleteRoadmapUseCase {
  constructor(
    @Inject(SKILL_TOKENS.ROADMAP_REPOSITORY)
    private readonly roadmapRepository: RoadmapRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const existingRoadmap = await this.roadmapRepository.findById(id);
    if (!existingRoadmap) {
      throw new NotFoundException(`Roadmap with ID ${id} not found`);
    }
    await this.roadmapRepository.delete(id);
  }
}
