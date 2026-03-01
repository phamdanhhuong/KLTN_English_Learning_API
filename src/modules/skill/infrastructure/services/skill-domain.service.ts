import { Injectable, Inject, Logger } from '@nestjs/common';
import { Skill } from '../../domain/entities/skill.entity';
import type { SkillDomainService } from '../../domain/services/skill-domain.service.interface';
import type { SkillRepository } from '../../domain/repositories/skill.repository.interface';
import type { SkillLevelRepository } from '../../domain/repositories/skill-level.repository.interface';
import { SKILL_TOKENS } from '../../domain/di/tokens';

@Injectable()
export class SkillDomainServiceImpl implements SkillDomainService {
  private readonly logger = new Logger(SkillDomainServiceImpl.name);

  constructor(
    @Inject(SKILL_TOKENS.SKILL_REPOSITORY)
    private readonly skillRepository: SkillRepository,
    @Inject(SKILL_TOKENS.SKILL_LEVEL_REPOSITORY)
    private readonly skillLevelRepository: SkillLevelRepository,
  ) {}

  async createSkillWithLevels(
    title: string,
    description?: string,
    position?: number,
    partId?: string,
  ): Promise<Skill> {
    const skill = Skill.create(title, description, position, partId);
    const createdSkill = await this.skillRepository.create(skill);

    const levels = [1, 2, 3, 4, 5, 6, 7];
    await this.skillLevelRepository.createLevelsForSkill(
      createdSkill.id,
      levels,
    );

    return createdSkill;
  }

  async validateSkillStructure(skillId: string): Promise<boolean> {
    const skill = await this.skillRepository.findById(skillId);
    if (!skill) return false;

    const levels = await this.skillLevelRepository.findBySkillId(skillId);
    const expectedLevels = [1, 2, 3, 4, 5, 6, 7];
    const actualLevels = levels.map((l) => l.level).sort();

    return JSON.stringify(expectedLevels) === JSON.stringify(actualLevels);
  }
}
