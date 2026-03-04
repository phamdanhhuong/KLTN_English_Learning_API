import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { SkillPartRepository } from '../../../domain/repositories/skill-part.repository.interface';
import { SKILL_TOKENS } from '../../../domain/di/tokens';

@Injectable()
export class DeleteSkillPartUseCase {
  constructor(
    @Inject(SKILL_TOKENS.SKILL_PART_REPOSITORY)
    private readonly skillPartRepository: SkillPartRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const skillPart = await this.skillPartRepository.findById(id);
    if (!skillPart) {
      throw new NotFoundException(`Skill part with ID ${id} not found`);
    }
    await this.skillPartRepository.delete(id);
  }
}
