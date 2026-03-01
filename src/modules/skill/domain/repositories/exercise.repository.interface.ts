import { Exercise } from '../entities/exercise.entity';

export interface ExerciseRepository {
  findById(id: string): Promise<Exercise | null>;
  findByLessonId(lessonId: string): Promise<Exercise[]>;
  findByLessonIdAndPosition(
    lessonId: string,
    position: number,
    excludeId?: string,
  ): Promise<Exercise | null>;
  getNextAvailablePosition(lessonId: string): Promise<number>;
  create(exercise: Exercise): Promise<Exercise>;
  createMany(exercises: Exercise[]): Promise<Exercise[]>;
  update(exercise: Exercise): Promise<Exercise>;
  delete(id: string): Promise<void>;
  deleteByLessonId(lessonId: string): Promise<void>;
  countByLessonId(lessonId: string): Promise<number>;
}
