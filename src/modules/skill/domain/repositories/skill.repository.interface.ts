import { Skill } from '../entities/skill.entity';

export interface SkillRepository {
  findAll(): Promise<Skill[]>;
  findById(id: string): Promise<Skill | null>;
  findByPosition(): Promise<Skill[]>;
  create(skill: Skill): Promise<Skill>;
  update(skill: Skill): Promise<Skill>;
  delete(id: string): Promise<void>;
  findByTitle(title: string): Promise<Skill | null>;
}
