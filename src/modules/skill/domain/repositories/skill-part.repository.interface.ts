import { SkillPart } from '../entities/skill-part.entity';

export interface SkillPartRepository {
  findAll(): Promise<SkillPart[]>;
  findById(id: string): Promise<SkillPart | null>;
  findWithProgress(userId: string): Promise<SkillPartWithProgress[]>;
  create(skillPart: SkillPart): Promise<SkillPart>;
  update(skillPart: SkillPart): Promise<SkillPart>;
  delete(id: string): Promise<void>;
}

export interface SkillPartWithProgress {
  id: string;
  name: string;
  description?: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
  totalSkills: number;
  completedSkills: number;
  progressPercentage: number;
  currentSkill?: {
    id: string;
    title: string;
    position: number;
  };
  skills: {
    id: string;
    title: string;
    description?: string;
    position: number;
    grammars: {
      id: string;
      rule: string;
      explanation?: string;
      examples?: any;
    }[];
  }[];
}
