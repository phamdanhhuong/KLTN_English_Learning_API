import { Injectable, Inject } from '@nestjs/common';
import { SKILL_TOKENS } from '../../../domain/di/tokens';
import { RoadmapRepository } from '../../../domain/repositories/roadmap.repository.interface';
import { RoadmapDto } from '../../dto/roadmap.dto';
import { RoadmapMapper } from '../../mappers/roadmap.mapper';

@Injectable()
export class GetAllRoadmapsUseCase {
  constructor(
    @Inject(SKILL_TOKENS.ROADMAP_REPOSITORY)
    private readonly roadmapRepository: RoadmapRepository,
  ) {}

  async execute(): Promise<RoadmapDto[]> {
    const roadmaps = await this.roadmapRepository.findAll();
    return roadmaps.map((r) => RoadmapMapper.toDto(r));
  }
}
