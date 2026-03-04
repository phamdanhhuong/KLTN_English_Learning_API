import { Lesson } from '../../domain/entities/lesson.entity';
import { Exercise } from '../../domain/entities/exercise.entity';
import { LessonDto, ExerciseDto, ExerciseTypeDto } from '../dto/lesson.dto';

export class LessonMapper {
  static toDto(lesson: Lesson): LessonDto {
    return {
      id: lesson.id,
      skillId: lesson.skillId,
      skillLevel: lesson.skillLevel,
      title: lesson.title,
      position: lesson.position,
      createdAt: lesson.createdAt,
      exerciseCount: lesson.getExerciseCount(),
      exercises: lesson.exercises?.map((exercise) =>
        LessonMapper.exerciseToDto(exercise),
      ),
    };
  }

  static exerciseToDto(exercise: Exercise): ExerciseDto {
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
