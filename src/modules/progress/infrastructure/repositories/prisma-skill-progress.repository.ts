import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import type { SkillProgressRepository } from '../../domain/repositories/skill-progress.repository.interface';
import { SkillProgressEntity } from '../../domain/entities/skill-progress.entity';

@Injectable()
export class PrismaSkillProgressRepository implements SkillProgressRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<SkillProgressEntity | null> {
    const record = await this.prisma.skillProgress.findUnique({
      where: { userId },
    });

    if (!record) return null;

    return new SkillProgressEntity(
      record.userId,
      record.skillId,
      record.levelReached,
      record.lessonPosition,
      record.lastPracticed,
    );
  }

  async findByUserIdAndSkillId(
    userId: string,
    skillId: string,
  ): Promise<SkillProgressEntity | null> {
    const record = await this.prisma.skillProgress.findFirst({
      where: { userId, skillId },
    });

    if (!record) return null;

    return new SkillProgressEntity(
      record.userId,
      record.skillId,
      record.levelReached,
      record.lessonPosition,
      record.lastPracticed,
    );
  }
}
