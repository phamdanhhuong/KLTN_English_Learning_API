import { Exercise } from '../../domain/entities/exercise.entity';
import { ExerciseDto, ExerciseTypeDto } from '../dto/exercise.dto';

export class ExerciseMapper {
  static toDto(exercise: Exercise): ExerciseDto {
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
