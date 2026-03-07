import { SkillProgressEntity } from '../../domain/entities/skill-progress.entity';
import { SkillProgressDto } from '../dto/skill-progress.dto';

export class SkillProgressMapper {
  static toDto(entity: SkillProgressEntity): SkillProgressDto {
    return {
      userId: entity.userId,
      skillId: entity.skillId,
      levelReached: entity.levelReached,
      lessonPosition: entity.lessonPosition,
      lastPracticed: entity.lastPracticed,
      completionPercentage: entity.completionPercentage,
    };
  }
}
