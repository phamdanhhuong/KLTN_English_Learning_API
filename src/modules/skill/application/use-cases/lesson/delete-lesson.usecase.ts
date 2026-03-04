import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { LessonRepository } from '../../../domain/repositories/lesson.repository.interface';
import { SKILL_TOKENS } from '../../../domain/di/tokens';

@Injectable()
export class DeleteLessonUseCase {
  constructor(
    @Inject(SKILL_TOKENS.LESSON_REPOSITORY)
    private readonly lessonRepository: LessonRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const lesson = await this.lessonRepository.findById(id);
    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${id} not found`);
    }
    await this.lessonRepository.delete(id);
  }
}
