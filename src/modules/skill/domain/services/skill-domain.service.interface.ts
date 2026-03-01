import { Skill } from '../entities/skill.entity';

export interface SkillDomainService {
  createSkillWithLevels(
    title: string,
    description?: string,
    position?: number,
    partId?: string,
  ): Promise<Skill>;

  validateSkillStructure(skillId: string): Promise<boolean>;
}
