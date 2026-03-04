import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { SkillRepository } from '../../../domain/repositories/skill.repository.interface';
import { SKILL_TOKENS } from '../../../domain/di/tokens';

@Injectable()
export class DeleteSkillUseCase {
  constructor(
    @Inject(SKILL_TOKENS.SKILL_REPOSITORY)
    private readonly skillRepository: SkillRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const skill = await this.skillRepository.findById(id);
    if (!skill) {
      throw new NotFoundException(`Skill with ID ${id} not found`);
    }
    await this.skillRepository.delete(id);
  }
}
