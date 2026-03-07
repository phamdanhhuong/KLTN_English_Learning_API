import { Injectable, Inject } from '@nestjs/common';
import type { SkillProgressRepository } from '../../domain/repositories/skill-progress.repository.interface';
import { SkillProgressDto } from '../dto/skill-progress.dto';
import { SkillProgressMapper } from '../mappers/skill-progress.mapper';
import { PROGRESS_TOKENS } from '../../domain/di/tokens';

@Injectable()
export class GetSkillProgressByUserIdUseCase {
  constructor(
    @Inject(PROGRESS_TOKENS.SKILL_PROGRESS_REPOSITORY)
    private readonly skillProgressRepository: SkillProgressRepository,
  ) {}

  async execute(userId: string): Promise<SkillProgressDto[]> {
    const progressList =
      await this.skillProgressRepository.findByUserId(userId);
    return progressList.map((p) => SkillProgressMapper.toDto(p));
  }
}
