import { Injectable, Inject } from '@nestjs/common';
import type { LessonRepository } from '../../../domain/repositories/lesson.repository.interface';
import { SKILL_TOKENS } from '../../../domain/di/tokens';
import { LessonDto } from '../../dto/lesson.dto';
import { LessonMapper } from '../../mappers/lesson.mapper';

@Injectable()
export class GetLessonsBySkillIdUseCase {
  constructor(
    @Inject(SKILL_TOKENS.LESSON_REPOSITORY)
    private readonly lessonRepository: LessonRepository,
  ) {}

  async execute(skillId: string): Promise<LessonDto[]> {
    const lessons = await this.lessonRepository.findBySkillId(skillId);
    return lessons.map((lesson) => LessonMapper.toDto(lesson));
  }
}
