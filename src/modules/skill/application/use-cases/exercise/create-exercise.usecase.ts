import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { ExerciseRepository } from '../../../domain/repositories/exercise.repository.interface';
import { CreateExerciseDto, ExerciseDto } from '../../dto/exercise.dto';
import { Exercise } from '../../../domain/entities/exercise.entity';
import { ExerciseMetaValidatorService } from '../../services/exercise-meta-validator.service';
import { ExerciseMapper } from '../../mappers/exercise.mapper';
import { SKILL_TOKENS } from '../../../domain/di/tokens';

@Injectable()
export class CreateExerciseUseCase {
  constructor(
    @Inject(SKILL_TOKENS.EXERCISE_REPOSITORY)
    private readonly exerciseRepository: ExerciseRepository,
    private readonly metaValidator: ExerciseMetaValidatorService,
  ) {}

  async execute(dto: CreateExerciseDto): Promise<ExerciseDto> {
    if (dto.meta) {
      const validationErrors = this.metaValidator.getMetaValidationErrors(
        dto.exerciseType as any,
        dto.meta,
      );
      if (validationErrors.length > 0) {
        throw new BadRequestException(
          `Invalid meta data: ${validationErrors.join(', ')}`,
        );
      }
    }

    let position = dto.position;

    if (position !== undefined) {
      const existingExerciseAtPosition =
        await this.exerciseRepository.findByLessonIdAndPosition(
          dto.lessonId,
          position,
        );
      if (existingExerciseAtPosition) {
        throw new BadRequestException(
          `Position ${position} is already taken by another exercise in this lesson`,
        );
      }
    } else {
      position = await this.exerciseRepository.getNextAvailablePosition(
        dto.lessonId,
      );
    }

    const exercise = Exercise.create(
      dto.lessonId,
      dto.exerciseType as any,
      dto.prompt,
      dto.meta,
      position,
    );

    const savedExercise = await this.exerciseRepository.create(exercise);
    return ExerciseMapper.toDto(savedExercise);
  }
}
