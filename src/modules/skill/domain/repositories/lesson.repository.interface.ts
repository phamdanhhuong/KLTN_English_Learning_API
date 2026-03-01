import { Lesson } from '../entities/lesson.entity';

export interface LessonRepository {
  findById(id: string): Promise<Lesson | null>;
  findBySkillLevel(skillId: string, level: number): Promise<Lesson[]>;
  findBySkillId(skillId: string): Promise<Lesson[]>;
  findBySkillLevelAndPosition(
    skillId: string,
    skillLevel: number,
    position: number,
    excludeId?: string,
  ): Promise<Lesson | null>;
  getNextAvailablePosition(
    skillId: string,
    skillLevel: number,
  ): Promise<number>;
  create(lesson: Lesson): Promise<Lesson>;
  update(lesson: Lesson): Promise<Lesson>;
  delete(id: string): Promise<void>;
}
