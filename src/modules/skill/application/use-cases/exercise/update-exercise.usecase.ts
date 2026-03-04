import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import type { ExerciseRepository } from '../../../domain/repositories/exercise.repository.interface';
import { UpdateExerciseDto, ExerciseDto } from '../../dto/exercise.dto';
import { Exercise } from '../../../domain/entities/exercise.entity';
import { ExerciseMetaValidatorService } from '../../services/exercise-meta-validator.service';
import { ExerciseMapper } from '../../mappers/exercise.mapper';
import { SKILL_TOKENS } from '../../../domain/di/tokens';

@Injectable()
export class UpdateExerciseUseCase {
  constructor(
    @Inject(SKILL_TOKENS.EXERCISE_REPOSITORY)
    private readonly exerciseRepository: ExerciseRepository,
    private readonly metaValidator: ExerciseMetaValidatorService,
  ) {}

  async execute(id: string, dto: UpdateExerciseDto): Promise<ExerciseDto> {
    const existingExercise = await this.exerciseRepository.findById(id);
    if (!existingExercise) {
      throw new NotFoundException(`Exercise with ID ${id} not found`);
    }

    if (dto.meta) {
      const exerciseType = dto.exerciseType || existingExercise.exerciseType;
      const validationErrors = this.metaValidator.getMetaValidationErrors(
        exerciseType as any,
        dto.meta,
      );
      if (validationErrors.length > 0) {
        throw new BadRequestException(
          `Invalid meta data: ${validationErrors.join(', ')}`,
        );
      }
    }

    let updatedExercise = existingExercise;

    if (dto.exerciseType) {
      updatedExercise = new Exercise(
        updatedExercise.id,
        updatedExercise.lessonId,
        dto.exerciseType as any,
        updatedExercise.prompt,
        updatedExercise.meta,
        updatedExercise.position,
        updatedExercise.createdAt,
      );
    }

    if (dto.prompt !== undefined) {
      updatedExercise = updatedExercise.updatePrompt(dto.prompt);
    }

    if (dto.meta !== undefined) {
      updatedExercise = updatedExercise.updateMeta(dto.meta);
    }

    if (dto.position !== undefined) {
      const existingExerciseAtPosition =
        await this.exerciseRepository.findByLessonIdAndPosition(
          existingExercise.lessonId,
          dto.position,
          id,
        );
      if (existingExerciseAtPosition) {
        throw new BadRequestException(
          `Position ${dto.position} is already taken by another exercise in this lesson`,
        );
      }
      updatedExercise = updatedExercise.updatePosition(dto.position);
    }

    const savedExercise = await this.exerciseRepository.update(updatedExercise);
    return ExerciseMapper.toDto(savedExercise);
  }
}
