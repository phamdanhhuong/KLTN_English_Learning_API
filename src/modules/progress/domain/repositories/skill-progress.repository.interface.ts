import type { SkillProgressEntity } from '../entities/skill-progress.entity';

export interface SkillProgressRepository {
  findByUserId(userId: string): Promise<SkillProgressEntity[]>;
  findByUserIdAndSkillId(
    userId: string,
    skillId: string,
  ): Promise<SkillProgressEntity | null>;
}
