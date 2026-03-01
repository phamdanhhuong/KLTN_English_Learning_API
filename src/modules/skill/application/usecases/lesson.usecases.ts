import {
  Injectable,
  NotFoundException,
  Inject,
  BadRequestException,
} from '@nestjs/common';
import type { LessonRepository } from '../../domain/repositories/lesson.repository.interface';
import {
  CreateLessonDto,
  UpdateLessonDto,
  LessonDto,
  ExerciseDto,
  ExerciseTypeDto,
} from '../dto/lesson.dto';
import { Lesson } from '../../domain/entities/lesson.entity';
import { Exercise } from '../../domain/entities/exercise.entity';
import { SKILL_TOKENS } from '../../domain/di/tokens';

@Injectable()
export class LessonUseCases {
  constructor(
    @Inject(SKILL_TOKENS.LESSON_REPOSITORY)
    private readonly lessonRepository: LessonRepository,
  ) {}

  async getLessonById(id: string): Promise<LessonDto> {
    const lesson = await this.lessonRepository.findById(id);
    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${id} not found`);
    }
    return this.toResponseDto(lesson);
  }

  async getLessonsBySkillLevel(
    skillId: string,
    level: number,
  ): Promise<LessonDto[]> {
    const lessons = await this.lessonRepository.findBySkillLevel(
      skillId,
      level,
    );
    return lessons.map((lesson) => this.toResponseDto(lesson));
  }

  async getLessonsBySkillId(skillId: string): Promise<LessonDto[]> {
    const lessons = await this.lessonRepository.findBySkillId(skillId);
    return lessons.map((lesson) => this.toResponseDto(lesson));
  }

  async createLesson(createLessonDto: CreateLessonDto): Promise<LessonDto> {
    let position = createLessonDto.position;

    if (position !== undefined) {
      const existingLessonAtPosition =
        await this.lessonRepository.findBySkillLevelAndPosition(
          createLessonDto.skillId,
          createLessonDto.skillLevel,
          position,
        );

      if (existingLessonAtPosition) {
        throw new BadRequestException(
          `Position ${position} is already taken by another lesson in skill level ${createLessonDto.skillLevel}`,
        );
      }
    } else {
      position = await this.lessonRepository.getNextAvailablePosition(
        createLessonDto.skillId,
        createLessonDto.skillLevel,
      );
    }

    const lesson = Lesson.create(
      createLessonDto.skillId,
      createLessonDto.skillLevel,
      createLessonDto.title,
      position,
    );

    const savedLesson = await this.lessonRepository.create(lesson);
    return this.toResponseDto(savedLesson);
  }

  async updateLesson(
    id: string,
    updateLessonDto: UpdateLessonDto,
  ): Promise<LessonDto> {
    const existingLesson = await this.lessonRepository.findById(id);
    if (!existingLesson) {
      throw new NotFoundException(`Lesson with ID ${id} not found`);
    }

    let updatedLesson = existingLesson;

    if (updateLessonDto.title) {
      updatedLesson = updatedLesson.updateTitle(updateLessonDto.title);
    }

    if (updateLessonDto.position !== undefined) {
      const existingLessonAtPosition =
        await this.lessonRepository.findBySkillLevelAndPosition(
          existingLesson.skillId,
          existingLesson.skillLevel,
          updateLessonDto.position,
          id,
        );

      if (existingLessonAtPosition) {
        throw new BadRequestException(
          `Position ${updateLessonDto.position} is already taken by another lesson in skill level ${existingLesson.skillLevel}`,
        );
      }

      updatedLesson = updatedLesson.updatePosition(updateLessonDto.position);
    }

    const savedLesson = await this.lessonRepository.update(updatedLesson);
    return this.toResponseDto(savedLesson);
  }

  async deleteLesson(id: string): Promise<void> {
    const lesson = await this.lessonRepository.findById(id);
    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${id} not found`);
    }
    await this.lessonRepository.delete(id);
  }

  private toResponseDto(lesson: Lesson): LessonDto {
    return {
      id: lesson.id,
      skillId: lesson.skillId,
      skillLevel: lesson.skillLevel,
      title: lesson.title,
      position: lesson.position,
      createdAt: lesson.createdAt,
      exerciseCount: lesson.getExerciseCount(),
      exercises: lesson.exercises?.map((exercise) =>
        this.exerciseToDto(exercise),
      ),
    };
  }

  private exerciseToDto(exercise: Exercise): ExerciseDto {
    return {
      id: exercise.id,
      lessonId: exercise.lessonId,
      exerciseType: exercise.exerciseType as unknown as ExerciseTypeDto,
      prompt: exercise.prompt,
      meta: exercise.meta,
      position: exercise.position,
      createdAt: exercise.createdAt,
      isInteractive: exercise.isInteractive(),
      isContentBased: exercise.isContentBased(),
    };
  }
}
