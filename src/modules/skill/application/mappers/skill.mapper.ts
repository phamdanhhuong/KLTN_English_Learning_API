import { Skill } from '../../domain/entities/skill.entity';
import { SkillDto } from '../dto/skill.dto';

export class SkillMapper {
  static toDto(skill: Skill): SkillDto {
    return {
      id: skill.id,
      title: skill.title,
      description: skill.description,
      position: skill.position,
      partId: skill.partId,
      createdAt: skill.createdAt,
      updatedAt: skill.updatedAt,
      levels: skill.skillLevels?.map((level) => ({
        skillId: level.skillId,
        level: level.level,
        description: level.getLevelDescription(),
        lessons: level.lessons?.map((lesson) => ({
          id: lesson.id,
          skillId: lesson.skillId,
          skillLevel: lesson.skillLevel,
          title: lesson.title,
          position: lesson.position,
          createdAt: lesson.createdAt,
        })),
      })),
    };
  }
}
