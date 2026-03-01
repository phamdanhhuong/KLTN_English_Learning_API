import { Exercise } from './exercise.entity';

export class Lesson {
  constructor(
    public readonly id: string,
    public readonly skillId: string,
    public readonly skillLevel: number,
    public readonly title: string,
    public readonly position: number = 0,
    public readonly createdAt: Date = new Date(),
    public readonly exercises?: Exercise[],
  ) {}

  static create(
    skillId: string,
    skillLevel: number,
    title: string,
    position?: number,
  ): Lesson {
    const id = crypto.randomUUID();
    return new Lesson(id, skillId, skillLevel, title, position);
  }

  updateTitle(newTitle: string): Lesson {
    return new Lesson(
      this.id,
      this.skillId,
      this.skillLevel,
      newTitle,
      this.position,
      this.createdAt,
      this.exercises,
    );
  }

  updatePosition(newPosition: number): Lesson {
    return new Lesson(
      this.id,
      this.skillId,
      this.skillLevel,
      this.title,
      newPosition,
      this.createdAt,
      this.exercises,
    );
  }

  getExerciseCount(): number {
    return this.exercises?.length || 0;
  }

  hasExercises(): boolean {
    return this.exercises !== undefined && this.exercises.length > 0;
  }
}
