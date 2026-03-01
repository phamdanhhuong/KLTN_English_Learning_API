import { SkillLevel } from '../entities/skill-level.entity';

export interface SkillLevelRepository {
  findBySkillId(skillId: string): Promise<SkillLevel[]>;
  findBySkillIdAndLevel(
    skillId: string,
    level: number,
  ): Promise<SkillLevel | null>;
  create(skillLevel: SkillLevel): Promise<SkillLevel>;
  createLevelsForSkill(
    skillId: string,
    levels: number[],
  ): Promise<SkillLevel[]>;
  delete(skillId: string, level: number): Promise<void>;
}
