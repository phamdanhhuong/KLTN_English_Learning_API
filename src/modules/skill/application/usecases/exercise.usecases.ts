import {
  Injectable,
  NotFoundException,
  Inject,
  BadRequestException,
} from '@nestjs/common';
import type { ExerciseRepository } from '../../domain/repositories/exercise.repository.interface';
import {
  CreateExerciseDto,
  UpdateExerciseDto,
  ExerciseDto,
  ExerciseTypeDto,
} from '../dto/exercise.dto';
import { Exercise } from '../../domain/entities/exercise.entity';
import { ExerciseMetaValidatorService } from '../services/exercise-meta-validator.service';
import { SKILL_TOKENS } from '../../domain/di/tokens';

@Injectable()
export class ExerciseUseCases {
  constructor(
    @Inject(SKILL_TOKENS.EXERCISE_REPOSITORY)
    private readonly exerciseRepository: ExerciseRepository,
    private readonly metaValidator: ExerciseMetaValidatorService,
  ) {}

  async getExerciseById(id: string): Promise<ExerciseDto> {
    const exercise = await this.exerciseRepository.findById(id);
    if (!exercise) {
      throw new NotFoundException(`Exercise with ID ${id} not found`);
    }
    return this.toResponseDto(exercise);
  }

  async getExercisesByLessonId(lessonId: string): Promise<ExerciseDto[]> {
    const exercises = await this.exerciseRepository.findByLessonId(lessonId);
    return exercises.map((exercise) => this.toResponseDto(exercise));
  }

  async createExercise(
    createExerciseDto: CreateExerciseDto,
  ): Promise<ExerciseDto> {
    if (createExerciseDto.meta) {
      const validationErrors = this.metaValidator.getMetaValidationErrors(
        createExerciseDto.exerciseType as any,
        createExerciseDto.meta,
      );
      if (validationErrors.length > 0) {
        throw new BadRequestException(
          `Invalid meta data: ${validationErrors.join(', ')}`,
        );
      }
    }

    let position = createExerciseDto.position;

    if (position !== undefined) {
      const existingExerciseAtPosition =
        await this.exerciseRepository.findByLessonIdAndPosition(
          createExerciseDto.lessonId,
          position,
        );
      if (existingExerciseAtPosition) {
        throw new BadRequestException(
          `Position ${position} is already taken by another exercise in this lesson`,
        );
      }
    } else {
      position = await this.exerciseRepository.getNextAvailablePosition(
        createExerciseDto.lessonId,
      );
    }

    const exercise = Exercise.create(
      createExerciseDto.lessonId,
      createExerciseDto.exerciseType as any,
      createExerciseDto.prompt,
      createExerciseDto.meta,
      position,
    );

    const savedExercise = await this.exerciseRepository.create(exercise);
    return this.toResponseDto(savedExercise);
  }

  async createManyExercises(
    exercises: CreateExerciseDto[],
  ): Promise<ExerciseDto[]> {
    const exerciseEntities: Exercise[] = [];

    for (const createExerciseDto of exercises) {
      let position = createExerciseDto.position;
      if (position === undefined) {
        position = await this.exerciseRepository.getNextAvailablePosition(
          createExerciseDto.lessonId,
        );
      }

      const exercise = Exercise.create(
        createExerciseDto.lessonId,
        createExerciseDto.exerciseType as any,
        createExerciseDto.prompt,
        createExerciseDto.meta,
        position,
      );

      exerciseEntities.push(exercise);
    }

    const savedExercises =
      await this.exerciseRepository.createMany(exerciseEntities);
    return savedExercises.map((exercise) => this.toResponseDto(exercise));
  }

  async updateExercise(
    id: string,
    updateExerciseDto: UpdateExerciseDto,
  ): Promise<ExerciseDto> {
    const existingExercise = await this.exerciseRepository.findById(id);
    if (!existingExercise) {
      throw new NotFoundException(`Exercise with ID ${id} not found`);
    }

    if (updateExerciseDto.meta) {
      const exerciseType =
        updateExerciseDto.exerciseType || existingExercise.exerciseType;
      const validationErrors = this.metaValidator.getMetaValidationErrors(
        exerciseType as any,
        updateExerciseDto.meta,
      );
      if (validationErrors.length > 0) {
        throw new BadRequestException(
          `Invalid meta data: ${validationErrors.join(', ')}`,
        );
      }
    }

    let updatedExercise = existingExercise;

    if (updateExerciseDto.exerciseType) {
      updatedExercise = new Exercise(
        updatedExercise.id,
        updatedExercise.lessonId,
        updateExerciseDto.exerciseType as any,
        updatedExercise.prompt,
        updatedExercise.meta,
        updatedExercise.position,
        updatedExercise.createdAt,
      );
    }

    if (updateExerciseDto.prompt !== undefined) {
      updatedExercise = updatedExercise.updatePrompt(updateExerciseDto.prompt);
    }

    if (updateExerciseDto.meta !== undefined) {
      updatedExercise = updatedExercise.updateMeta(updateExerciseDto.meta);
    }

    if (updateExerciseDto.position !== undefined) {
      const existingExerciseAtPosition =
        await this.exerciseRepository.findByLessonIdAndPosition(
          existingExercise.lessonId,
          updateExerciseDto.position,
          id,
        );
      if (existingExerciseAtPosition) {
        throw new BadRequestException(
          `Position ${updateExerciseDto.position} is already taken by another exercise in this lesson`,
        );
      }
      updatedExercise = updatedExercise.updatePosition(
        updateExerciseDto.position,
      );
    }

    const savedExercise = await this.exerciseRepository.update(updatedExercise);
    return this.toResponseDto(savedExercise);
  }

  async deleteExercise(id: string): Promise<void> {
    const exercise = await this.exerciseRepository.findById(id);
    if (!exercise) {
      throw new NotFoundException(`Exercise with ID ${id} not found`);
    }
    await this.exerciseRepository.delete(id);
  }

  async deleteExercisesByLessonId(lessonId: string): Promise<void> {
    await this.exerciseRepository.deleteByLessonId(lessonId);
  }

  async getExerciseCount(lessonId: string): Promise<number> {
    return await this.exerciseRepository.countByLessonId(lessonId);
  }

  private toResponseDto(exercise: Exercise): ExerciseDto {
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
