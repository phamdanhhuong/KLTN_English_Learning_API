import { Injectable, Inject } from '@nestjs/common';
import type { SkillRepository } from '../../../domain/repositories/skill.repository.interface';
import { SKILL_TOKENS } from '../../../domain/di/tokens';
import { SkillDto } from '../../dto/skill.dto';
import { SkillMapper } from '../../mappers/skill.mapper';

@Injectable()
export class GetAllSkillsUseCase {
  constructor(
    @Inject(SKILL_TOKENS.SKILL_REPOSITORY)
    private readonly skillRepository: SkillRepository,
  ) {}

  async execute(): Promise<SkillDto[]> {
    const skills = await this.skillRepository.findByPosition();
    return skills.map((skill) => SkillMapper.toDto(skill));
  }
}
