import { ExerciseDto } from './exercise.dto';

export class ReviewLessonDto {
  id: string;
  skillId: string;
  skillLevel: number;
  title: string;
  position: number;
  exercises: ExerciseDto[];
  exerciseCount: number;
  createdAt: Date;
}
