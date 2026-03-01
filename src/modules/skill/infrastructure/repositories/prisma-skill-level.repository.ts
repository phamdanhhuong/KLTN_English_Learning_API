import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { SkillLevel } from '../../domain/entities/skill-level.entity';
import type { SkillLevelRepository as SkillLevelRepositoryInterface } from '../../domain/repositories/skill-level.repository.interface';

@Injectable()
export class PrismaSkillLevelRepository implements SkillLevelRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  async findBySkillId(skillId: string): Promise<SkillLevel[]> {
    const skillLevels = await this.prisma.skillLevel.findMany({
      where: { skillId },
      orderBy: { level: 'asc' },
    });

    return skillLevels.map((sl) => new SkillLevel(sl.skillId, sl.level));
  }

  async findBySkillIdAndLevel(
    skillId: string,
    level: number,
  ): Promise<SkillLevel | null> {
    const skillLevel = await this.prisma.skillLevel.findUnique({
      where: { skillId_level: { skillId, level } },
    });

    if (!skillLevel) return null;
    return new SkillLevel(skillLevel.skillId, skillLevel.level);
  }

  async create(skillLevel: SkillLevel): Promise<SkillLevel> {
    const created = await this.prisma.skillLevel.create({
      data: { skillId: skillLevel.skillId, level: skillLevel.level },
    });
    return new SkillLevel(created.skillId, created.level);
  }

  async createLevelsForSkill(
    skillId: string,
    levels: number[],
  ): Promise<SkillLevel[]> {
    const createdLevels = await this.prisma.$transaction(
      levels.map((level) =>
        this.prisma.skillLevel.create({
          data: { skillId, level },
        }),
      ),
    );

    return createdLevels.map((sl) => new SkillLevel(sl.skillId, sl.level));
  }

  async delete(skillId: string, level: number): Promise<void> {
    await this.prisma.skillLevel.delete({
      where: { skillId_level: { skillId, level } },
    });
  }
}
