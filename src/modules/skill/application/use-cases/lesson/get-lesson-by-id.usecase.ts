import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { LessonRepository } from '../../../domain/repositories/lesson.repository.interface';
import { SKILL_TOKENS } from '../../../domain/di/tokens';
import { LessonDto } from '../../dto/lesson.dto';
import { LessonMapper } from '../../mappers/lesson.mapper';

@Injectable()
export class GetLessonByIdUseCase {
  constructor(
    @Inject(SKILL_TOKENS.LESSON_REPOSITORY)
    private readonly lessonRepository: LessonRepository,
  ) {}

  async execute(id: string): Promise<LessonDto> {
    const lesson = await this.lessonRepository.findById(id);
    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${id} not found`);
    }
    return LessonMapper.toDto(lesson);
  }
}
