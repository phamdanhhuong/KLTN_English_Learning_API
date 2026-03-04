import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { SkillRepository } from '../../../domain/repositories/skill.repository.interface';
import { SKILL_TOKENS } from '../../../domain/di/tokens';
import { SkillDto } from '../../dto/skill.dto';
import { SkillMapper } from '../../mappers/skill.mapper';

@Injectable()
export class GetSkillByIdUseCase {
  constructor(
    @Inject(SKILL_TOKENS.SKILL_REPOSITORY)
    private readonly skillRepository: SkillRepository,
  ) {}

  async execute(id: string): Promise<SkillDto> {
    const skill = await this.skillRepository.findById(id);
    if (!skill) {
      throw new NotFoundException(`Skill with ID ${id} not found`);
    }
    return SkillMapper.toDto(skill);
  }
}
