import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { LessonRepository } from '../../../domain/repositories/lesson.repository.interface';
import { SKILL_TOKENS } from '../../../domain/di/tokens';
import { Lesson } from '../../../domain/entities/lesson.entity';
import { CreateLessonDto, LessonDto } from '../../dto/lesson.dto';
import { LessonMapper } from '../../mappers/lesson.mapper';

@Injectable()
export class CreateLessonUseCase {
  constructor(
    @Inject(SKILL_TOKENS.LESSON_REPOSITORY)
    private readonly lessonRepository: LessonRepository,
  ) {}

  async execute(dto: CreateLessonDto): Promise<LessonDto> {
    let position = dto.position;

    if (position !== undefined) {
      const existingLessonAtPosition =
        await this.lessonRepository.findBySkillLevelAndPosition(
          dto.skillId,
          dto.skillLevel,
          position,
        );

      if (existingLessonAtPosition) {
        throw new BadRequestException(
          `Position ${position} is already taken by another lesson in skill level ${dto.skillLevel}`,
        );
      }
    } else {
      position = await this.lessonRepository.getNextAvailablePosition(
        dto.skillId,
        dto.skillLevel,
      );
    }

    const lesson = Lesson.create(
      dto.skillId,
      dto.skillLevel,
      dto.title,
      position,
    );
    const savedLesson = await this.lessonRepository.create(lesson);
    return LessonMapper.toDto(savedLesson);
  }
}
