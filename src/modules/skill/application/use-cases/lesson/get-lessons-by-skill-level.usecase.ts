import { Injectable, Inject } from '@nestjs/common';
import type { LessonRepository } from '../../../domain/repositories/lesson.repository.interface';
import { SKILL_TOKENS } from '../../../domain/di/tokens';
import { LessonDto } from '../../dto/lesson.dto';
import { LessonMapper } from '../../mappers/lesson.mapper';

@Injectable()
export class GetLessonsBySkillLevelUseCase {
  constructor(
    @Inject(SKILL_TOKENS.LESSON_REPOSITORY)
    private readonly lessonRepository: LessonRepository,
  ) {}

  async execute(skillId: string, level: number): Promise<LessonDto[]> {
    const lessons = await this.lessonRepository.findBySkillLevel(
      skillId,
      level,
    );
    return lessons.map((lesson) => LessonMapper.toDto(lesson));
  }
}
