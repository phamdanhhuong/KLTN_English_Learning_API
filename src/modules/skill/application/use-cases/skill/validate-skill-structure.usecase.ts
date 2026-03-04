import { Injectable, Inject } from '@nestjs/common';
import type { SkillDomainService } from '../../../domain/services/skill-domain.service.interface';
import { SKILL_TOKENS } from '../../../domain/di/tokens';

@Injectable()
export class ValidateSkillStructureUseCase {
  constructor(
    @Inject(SKILL_TOKENS.SKILL_DOMAIN_SERVICE)
    private readonly skillDomainService: SkillDomainService,
  ) {}

  async execute(id: string): Promise<{ isValid: boolean; message: string }> {
    const isValid = await this.skillDomainService.validateSkillStructure(id);
    return {
      isValid,
      message: isValid
        ? 'Skill structure is valid'
        : 'Skill structure is invalid - missing required levels',
    };
  }
}
