import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { RedisService } from '../../../../infrastructure/cache/redis.service';
import type { SkillRepository as SkillRepositoryInterface } from '../../domain/repositories/skill.repository.interface';
import { Skill } from '../../domain/entities/skill.entity';
import { SkillLevel } from '../../domain/entities/skill-level.entity';
import { Lesson } from '../../domain/entities/lesson.entity';

@Injectable()
export class PrismaSkillRepository implements SkillRepositoryInterface {
  private readonly cachePrefix = 'skill:';
  private readonly cacheTtl = 3600;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async findAll(): Promise<Skill[]> {
    const cacheKey = `${this.cachePrefix}all`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      const data = JSON.parse(cached);
      return data.map((d: any) => this.toDomain(d));
    }

    const skills = await this.prisma.skill.findMany({
      orderBy: { position: 'asc' },
    });

    await this.redis.set(cacheKey, JSON.stringify(skills), this.cacheTtl);
    return skills.map((s: any) => this.toDomain(s));
  }

  async findById(id: string): Promise<Skill | null> {
    const cacheKey = `${this.cachePrefix}${id}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return this.toDomain(JSON.parse(cached));
    }

    const skill = await this.prisma.skill.findUnique({
      where: { id },
      include: {
        skillLevels: {
          include: {
            lessons: { orderBy: { position: 'asc' } },
          },
        },
      },
    });

    if (skill) {
      await this.redis.set(cacheKey, JSON.stringify(skill), this.cacheTtl);
      return this.toDomain(skill);
    }

    return null;
  }

  async findByPosition(): Promise<Skill[]> {
    return this.findAll();
  }

  async create(skill: Skill): Promise<Skill> {
    let partId = skill.partId;

    if (!partId) {
      let defaultSkillPart = await this.prisma.skillPart.findFirst({
        orderBy: { position: 'asc' },
      });
      if (!defaultSkillPart) {
        defaultSkillPart = await this.prisma.skillPart.create({
          data: {
            name: 'Default Part',
            description: 'Default skill part',
            position: 1,
          },
        });
      }
      partId = defaultSkillPart.id;
    }

    const created = await this.prisma.skill.create({
      data: {
        id: skill.id,
        title: skill.title,
        description: skill.description,
        position: skill.position,
        partId: partId,
        createdAt: skill.createdAt,
        updatedAt: skill.updatedAt,
      },
    });

    await this.redis.del(`${this.cachePrefix}all`);
    await this.redis.set(
      `${this.cachePrefix}${created.id}`,
      JSON.stringify(created),
      this.cacheTtl,
    );

    return this.toDomain(created);
  }

  async update(skill: Skill): Promise<Skill> {
    const updated = await this.prisma.skill.update({
      where: { id: skill.id },
      data: {
        title: skill.title,
        description: skill.description,
        position: skill.position,
        partId: skill.partId,
        updatedAt: skill.updatedAt,
      },
    });

    await this.redis.del(`${this.cachePrefix}all`);
    await this.redis.set(
      `${this.cachePrefix}${updated.id}`,
      JSON.stringify(updated),
      this.cacheTtl,
    );

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.skill.delete({ where: { id } });
    await this.redis.del(`${this.cachePrefix}all`);
    await this.redis.del(`${this.cachePrefix}${id}`);
  }

  async findByTitle(title: string): Promise<Skill | null> {
    const skill = await this.prisma.skill.findFirst({ where: { title } });
    return skill ? this.toDomain(skill) : null;
  }

  private toDomain(data: any): Skill {
    const skillLevels = data.skillLevels?.map(
      (levelData: any) =>
        new SkillLevel(
          levelData.skillId,
          levelData.level,
          levelData.lessons?.map(
            (lessonData: any) =>
              new Lesson(
                lessonData.id,
                lessonData.skillId,
                lessonData.skillLevel,
                lessonData.title,
                lessonData.position,
                lessonData.createdAt,
              ),
          ),
        ),
    );

    return new Skill(
      data.id,
      data.title,
      data.description,
      data.position,
      data.partId,
      data.createdAt,
      data.updatedAt,
      skillLevels,
    );
  }
}
