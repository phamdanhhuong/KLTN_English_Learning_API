import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import type { LessonRepository } from '../../../domain/repositories/lesson.repository.interface';
import { SKILL_TOKENS } from '../../../domain/di/tokens';
import { UpdateLessonDto, LessonDto } from '../../dto/lesson.dto';
import { LessonMapper } from '../../mappers/lesson.mapper';

@Injectable()
export class UpdateLessonUseCase {
  constructor(
    @Inject(SKILL_TOKENS.LESSON_REPOSITORY)
    private readonly lessonRepository: LessonRepository,
  ) {}

  async execute(id: string, dto: UpdateLessonDto): Promise<LessonDto> {
    const existingLesson = await this.lessonRepository.findById(id);
    if (!existingLesson) {
      throw new NotFoundException(`Lesson with ID ${id} not found`);
    }

    let updatedLesson = existingLesson;

    if (dto.title) {
      updatedLesson = updatedLesson.updateTitle(dto.title);
    }

    if (dto.position !== undefined) {
      const existingLessonAtPosition =
        await this.lessonRepository.findBySkillLevelAndPosition(
          existingLesson.skillId,
          existingLesson.skillLevel,
          dto.position,
          id,
        );

      if (existingLessonAtPosition) {
        throw new BadRequestException(
          `Position ${dto.position} is already taken by another lesson in skill level ${existingLesson.skillLevel}`,
        );
      }

      updatedLesson = updatedLesson.updatePosition(dto.position);
    }

    const savedLesson = await this.lessonRepository.update(updatedLesson);
    return LessonMapper.toDto(savedLesson);
  }
}
