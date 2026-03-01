import { SkillPart } from '../entities/skill-part.entity';

export interface SkillPartRepository {
  findAll(): Promise<SkillPart[]>;
  findById(id: string): Promise<SkillPart | null>;
  create(skillPart: SkillPart): Promise<SkillPart>;
  update(skillPart: SkillPart): Promise<SkillPart>;
  delete(id: string): Promise<void>;
}
