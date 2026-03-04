import { Injectable, Inject } from '@nestjs/common';
import type { SkillPartRepository } from '../../../domain/repositories/skill-part.repository.interface';
import { SKILL_TOKENS } from '../../../domain/di/tokens';
import { SkillPart } from '../../../domain/entities/skill-part.entity';
import { CreateSkillPartDto } from '../../dto/skill.dto';

@Injectable()
export class CreateSkillPartUseCase {
  constructor(
    @Inject(SKILL_TOKENS.SKILL_PART_REPOSITORY)
    private readonly skillPartRepository: SkillPartRepository,
  ) {}

  async execute(dto: CreateSkillPartDto): Promise<SkillPart> {
    const skillPart = SkillPart.create(dto.name, dto.description, dto.position);
    return this.skillPartRepository.create(skillPart);
  }
}
