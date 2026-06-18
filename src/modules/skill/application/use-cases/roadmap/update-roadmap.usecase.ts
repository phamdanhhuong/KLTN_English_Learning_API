import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { SKILL_TOKENS } from '../../../domain/di/tokens';
import { RoadmapRepository } from '../../../domain/repositories/roadmap.repository.interface';
import { UpdateRoadmapDto, RoadmapDto } from '../../dto/roadmap.dto';
import { RoadmapMapper } from '../../mappers/roadmap.mapper';

@Injectable()
export class UpdateRoadmapUseCase {
  constructor(
    @Inject(SKILL_TOKENS.ROADMAP_REPOSITORY)
    private readonly roadmapRepository: RoadmapRepository,
  ) {}

  async execute(id: string, dto: UpdateRoadmapDto): Promise<RoadmapDto> {
    const existingRoadmap = await this.roadmapRepository.findById(id);
    if (!existingRoadmap) {
      throw new NotFoundException(`Roadmap with ID ${id} not found`);
    }

    const updatedRoadmap = existingRoadmap.update(dto);
    const saved = await this.roadmapRepository.update(updatedRoadmap);
    return RoadmapMapper.toDto(saved);
  }
}
