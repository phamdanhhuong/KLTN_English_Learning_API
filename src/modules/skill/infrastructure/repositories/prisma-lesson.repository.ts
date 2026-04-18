import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { RedisService } from '../../../../infrastructure/cache/redis.service';
import type { LessonRepository as LessonRepositoryInterface } from '../../domain/repositories/lesson.repository.interface';
import { Lesson } from '../../domain/entities/lesson.entity';
import { Exercise, ExerciseType } from '../../domain/entities/exercise.entity';

@Injectable()
export class PrismaLessonRepository implements LessonRepositoryInterface {
  private readonly cachePrefix = 'lesson:';
  private readonly cacheTtl = 3600;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async findById(id: string): Promise<Lesson | null> {
    const cacheKey = `${this.cachePrefix}${id}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return this.toDomain(JSON.parse(cached));
    }

    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: {
        exercises: { orderBy: { position: 'asc' } },
      },
    });

    if (lesson) {
      await this.redis.set(cacheKey, JSON.stringify(lesson), this.cacheTtl);
      return this.toDomain(lesson);
    }

    return null;
  }

  async findBySkillLevel(skillId: string, level: number): Promise<Lesson[]> {
    const cacheKey = `${this.cachePrefix}skill:${skillId}:level:${level}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      const data = JSON.parse(cached);
      return data.map((d: any) => this.toDomain(d));
    }

    const lessons = await this.prisma.lesson.findMany({
      where: { skillId, skillLevel: level },
      include: {
        exercises: { orderBy: { position: 'asc' } },
      },
      orderBy: { position: 'asc' },
    });

    await this.redis.set(cacheKey, JSON.stringify(lessons), this.cacheTtl);
    return lessons.map((l: any) => this.toDomain(l));
  }

  async findBySkillId(skillId: string): Promise<Lesson[]> {
    const cacheKey = `${this.cachePrefix}skill:${skillId}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      const data = JSON.parse(cached);
      return data.map((d: any) => this.toDomain(d));
    }

    const lessons = await this.prisma.lesson.findMany({
      where: { skillId },
      include: {
        exercises: { orderBy: { position: 'asc' } },
      },
      orderBy: [{ skillLevel: 'asc' }, { position: 'asc' }],
    });

    await this.redis.set(cacheKey, JSON.stringify(lessons), this.cacheTtl);
    return lessons.map((l: any) => this.toDomain(l));
  }

  async findBySkillLevelAndPosition(
    skillId: string,
    skillLevel: number,
    position: number,
    excludeId?: string,
  ): Promise<Lesson | null> {
    const lesson = await this.prisma.lesson.findFirst({
      where: {
        skillId,
        skillLevel,
        position,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });
    return lesson ? this.toDomain(lesson) : null;
  }

  async getNextAvailablePosition(
    skillId: string,
    skillLevel: number,
  ): Promise<number> {
    const maxPosition = await this.prisma.lesson.aggregate({
      where: { skillId, skillLevel },
      _max: { position: true },
    });
    return (maxPosition._max.position ?? -1) + 1;
  }

  async create(lesson: Lesson): Promise<Lesson> {
    const created = await this.prisma.lesson.create({
      data: {
        id: lesson.id,
        skillId: lesson.skillId,
        skillLevel: lesson.skillLevel,
        title: lesson.title,
        position: lesson.position,
        createdAt: lesson.createdAt,
      },
    });

    await this.invalidateCache(lesson.skillId, lesson.skillLevel);
    await this.redis.set(
      `${this.cachePrefix}${created.id}`,
      JSON.stringify(created),
      this.cacheTtl,
    );

    return this.toDomain(created);
  }

  async update(lesson: Lesson): Promise<Lesson> {
    const updated = await this.prisma.lesson.update({
      where: { id: lesson.id },
      data: {
        title: lesson.title,
        position: lesson.position,
      },
    });

    await this.invalidateCache(lesson.skillId, lesson.skillLevel);
    await this.redis.set(
      `${this.cachePrefix}${updated.id}`,
      JSON.stringify(updated),
      this.cacheTtl,
    );

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      select: { skillId: true, skillLevel: true },
    });

    if (lesson) {
      await this.prisma.lesson.delete({ where: { id } });
      await this.invalidateCache(lesson.skillId, lesson.skillLevel);
      await this.redis.del(`${this.cachePrefix}${id}`);
    }
  }

  private async invalidateCache(
    skillId: string,
    skillLevel?: number,
  ): Promise<void> {
    await this.redis.del(`${this.cachePrefix}skill:${skillId}`);
    if (skillLevel) {
      await this.redis.del(
        `${this.cachePrefix}skill:${skillId}:level:${skillLevel}`,
      );
    }
  }

  async invalidateCacheForLesson(
    lessonId: string,
    skillId: string,
    skillLevel: number,
  ): Promise<void> {
    await this.redis.del(`${this.cachePrefix}${lessonId}`);
    await this.invalidateCache(skillId, skillLevel);
  }

  private toDomain(data: any): Lesson {
    const exercises = data.exercises?.map(
      (exerciseData: any) =>
        new Exercise(
          exerciseData.id,
          exerciseData.lessonId,
          exerciseData.exerciseType as ExerciseType,
          exerciseData.prompt,
          exerciseData.meta,
          exerciseData.position,
          exerciseData.createdAt,
        ),
    );

    return new Lesson(
      data.id,
      data.skillId,
      data.skillLevel,
      data.title,
      data.position,
      data.createdAt,
      exercises,
    );
  }
}
