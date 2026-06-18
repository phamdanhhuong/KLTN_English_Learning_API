import { Injectable, Inject } from '@nestjs/common';
import { SKILL_TOKENS } from '../../../domain/di/tokens';
import { RoadmapRepository } from '../../../domain/repositories/roadmap.repository.interface';
import { Roadmap } from '../../../domain/entities/roadmap.entity';
import { CreateRoadmapDto, RoadmapDto } from '../../dto/roadmap.dto';
import { RoadmapMapper } from '../../mappers/roadmap.mapper';

@Injectable()
export class CreateRoadmapUseCase {
  constructor(
    @Inject(SKILL_TOKENS.ROADMAP_REPOSITORY)
    private readonly roadmapRepository: RoadmapRepository,
  ) {}

  async execute(dto: CreateRoadmapDto): Promise<RoadmapDto> {
    let roadmap = Roadmap.create(dto.title, dto.targetGoal, dto.description);
    if (dto.isActive !== undefined) {
      roadmap = roadmap.update({ isActive: dto.isActive });
    }
    const created = await this.roadmapRepository.create(roadmap);
    return RoadmapMapper.toDto(created);
  }
}
