import { Injectable, Inject } from '@nestjs/common';
import type { SkillDomainService } from '../../../domain/services/skill-domain.service.interface';
import { SKILL_TOKENS } from '../../../domain/di/tokens';
import { CreateSkillDto, SkillDto } from '../../dto/skill.dto';
import { SkillMapper } from '../../mappers/skill.mapper';

@Injectable()
export class CreateSkillUseCase {
  constructor(
    @Inject(SKILL_TOKENS.SKILL_DOMAIN_SERVICE)
    private readonly skillDomainService: SkillDomainService,
  ) {}

  async execute(dto: CreateSkillDto): Promise<SkillDto> {
    const skill = await this.skillDomainService.createSkillWithLevels(
      dto.title,
      dto.description,
      dto.position,
      dto.partId,
    );
    return SkillMapper.toDto(skill);
  }
}
