import { Injectable, Inject } from '@nestjs/common';
import type { SkillPartRepository } from '../../../domain/repositories/skill-part.repository.interface';
import { SKILL_TOKENS } from '../../../domain/di/tokens';
import { SkillPart } from '../../../domain/entities/skill-part.entity';

@Injectable()
export class GetAllSkillPartsUseCase {
  constructor(
    @Inject(SKILL_TOKENS.SKILL_PART_REPOSITORY)
    private readonly skillPartRepository: SkillPartRepository,
  ) {}

  async execute(): Promise<SkillPart[]> {
    return this.skillPartRepository.findAll();
  }
}
