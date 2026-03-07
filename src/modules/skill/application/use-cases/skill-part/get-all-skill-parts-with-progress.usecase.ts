import { Injectable, Inject } from '@nestjs/common';
import type { SkillPartRepository, SkillPartWithProgress } from '../../../domain/repositories/skill-part.repository.interface';
import { SKILL_TOKENS } from '../../../domain/di/tokens';

@Injectable()
export class GetAllSkillPartsWithProgressUseCase {
  constructor(
    @Inject(SKILL_TOKENS.SKILL_PART_REPOSITORY)
    private readonly skillPartRepository: SkillPartRepository,
  ) {}

  async execute(userId: string): Promise<SkillPartWithProgress[]> {
    return this.skillPartRepository.findWithProgress(userId);
  }
}
