import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { RedisService } from '../../../../infrastructure/cache/redis.service';
import type { ExerciseRepository as ExerciseRepositoryInterface } from '../../domain/repositories/exercise.repository.interface';
import { Exercise, ExerciseType } from '../../domain/entities/exercise.entity';

@Injectable()
export class PrismaExerciseRepository implements ExerciseRepositoryInterface {
  private readonly cachePrefix = 'exercise:';
  private readonly cacheTtl = 3600;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async findById(id: string): Promise<Exercise | null> {
    const cacheKey = `${this.cachePrefix}${id}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return this.toDomain(JSON.parse(cached));
    }

    const exercise = await this.prisma.exercise.findUnique({ where: { id } });

    if (exercise) {
      await this.redis.set(cacheKey, JSON.stringify(exercise), this.cacheTtl);
      return this.toDomain(exercise);
    }

    return null;
  }

  async findByLessonId(lessonId: string): Promise<Exercise[]> {
    const cacheKey = `${this.cachePrefix}lesson:${lessonId}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      const data = JSON.parse(cached);
      return data.map((d: any) => this.toDomain(d));
    }

    const exercises = await this.prisma.exercise.findMany({
      where: { lessonId },
      orderBy: { position: 'asc' },
    });

    await this.redis.set(cacheKey, JSON.stringify(exercises), this.cacheTtl);
    return exercises.map((e: any) => this.toDomain(e));
  }

  async findByLessonIdAndPosition(
    lessonId: string,
    position: number,
    excludeId?: string,
  ): Promise<Exercise | null> {
    const exercise = await this.prisma.exercise.findFirst({
      where: {
        lessonId,
        position,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });
    return exercise ? this.toDomain(exercise) : null;
  }

  async getNextAvailablePosition(lessonId: string): Promise<number> {
    const maxPosition = await this.prisma.exercise.aggregate({
      where: { lessonId },
      _max: { position: true },
    });
    return (maxPosition._max.position ?? -1) + 1;
  }

  async create(exercise: Exercise): Promise<Exercise> {
    const created = await this.prisma.exercise.create({
      data: {
        id: exercise.id,
        lessonId: exercise.lessonId,
        exerciseType: exercise.exerciseType,
        prompt: exercise.prompt,
        meta: exercise.meta as any,
        position: exercise.position,
        createdAt: exercise.createdAt,
      },
    });

    await this.invalidateCache(exercise.lessonId);
    await this.redis.set(
      `${this.cachePrefix}${created.id}`,
      JSON.stringify(created),
      this.cacheTtl,
    );

    return this.toDomain(created);
  }

  async createMany(exercises: Exercise[]): Promise<Exercise[]> {
    await this.prisma.exercise.createMany({
      data: exercises.map((exercise) => ({
        id: exercise.id,
        lessonId: exercise.lessonId,
        exerciseType: exercise.exerciseType,
        prompt: exercise.prompt,
        meta: exercise.meta as any,
        position: exercise.position,
        createdAt: exercise.createdAt,
      })),
    });

    const lessonIds = [...new Set(exercises.map((ex) => ex.lessonId))];
    for (const lessonId of lessonIds) {
      await this.invalidateCache(lessonId);
    }

    return exercises;
  }

  async update(exercise: Exercise): Promise<Exercise> {
    const updated = await this.prisma.exercise.update({
      where: { id: exercise.id },
      data: {
        exerciseType: exercise.exerciseType,
        prompt: exercise.prompt,
        meta: exercise.meta as any,
        position: exercise.position,
      },
    });

    await this.invalidateCache(exercise.lessonId);
    await this.redis.set(
      `${this.cachePrefix}${updated.id}`,
      JSON.stringify(updated),
      this.cacheTtl,
    );

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    const exercise = await this.prisma.exercise.findUnique({
      where: { id },
      select: { lessonId: true },
    });

    if (exercise) {
      await this.prisma.exercise.delete({ where: { id } });
      await this.invalidateCache(exercise.lessonId);
      await this.redis.del(`${this.cachePrefix}${id}`);
    }
  }

  async deleteByLessonId(lessonId: string): Promise<void> {
    await this.prisma.exercise.deleteMany({ where: { lessonId } });
    await this.invalidateCache(lessonId);
  }

  async countByLessonId(lessonId: string): Promise<number> {
    const cacheKey = `${this.cachePrefix}count:${lessonId}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) return parseInt(cached, 10);

    const count = await this.prisma.exercise.count({ where: { lessonId } });
    await this.redis.set(cacheKey, count.toString(), this.cacheTtl);
    return count;
  }

  private async invalidateCache(lessonId: string): Promise<void> {
    await this.redis.del(`${this.cachePrefix}lesson:${lessonId}`);
    await this.redis.del(`${this.cachePrefix}count:${lessonId}`);
  }

  private toDomain(data: any): Exercise {
    return new Exercise(
      data.id,
      data.lessonId,
      data.exerciseType as ExerciseType,
      data.prompt,
      data.meta,
      data.position,
      data.createdAt,
    );
  }
}
