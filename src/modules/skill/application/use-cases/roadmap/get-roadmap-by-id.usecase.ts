import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { SKILL_TOKENS } from '../../../domain/di/tokens';
import { RoadmapRepository } from '../../../domain/repositories/roadmap.repository.interface';
import { RoadmapDto } from '../../dto/roadmap.dto';
import { RoadmapMapper } from '../../mappers/roadmap.mapper';

@Injectable()
export class GetRoadmapByIdUseCase {
  constructor(
    @Inject(SKILL_TOKENS.ROADMAP_REPOSITORY)
    private readonly roadmapRepository: RoadmapRepository,
  ) {}

  async execute(id: string): Promise<RoadmapDto> {
    const roadmap = await this.roadmapRepository.findById(id);
    if (!roadmap) {
      throw new NotFoundException(`Roadmap with ID ${id} not found`);
    }
    return RoadmapMapper.toDto(roadmap);
  }
}
