import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import type { UserCustomSkillRepository as UserCustomSkillRepositoryInterface } from '../../domain/repositories/user-custom-skill.repository.interface';
import { UserCustomSkill } from '../../domain/entities/user-custom-skill.entity';

@Injectable()
export class PrismaUserCustomSkillRepository
  implements UserCustomSkillRepositoryInterface
{
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<UserCustomSkill | null> {
    const record = await this.prisma.userCustomSkill.findUnique({
      where: { userId },
    });

    if (!record) return null;

    return new UserCustomSkill(
      record.id,
      record.userId,
      record.skillId,
      record.createdAt,
    );
  }

  async create(userCustomSkill: UserCustomSkill): Promise<UserCustomSkill> {
    const created = await this.prisma.userCustomSkill.create({
      data: {
        id: userCustomSkill.id,
        userId: userCustomSkill.userId,
        skillId: userCustomSkill.skillId,
        createdAt: userCustomSkill.createdAt,
      },
    });

    return new UserCustomSkill(
      created.id,
      created.userId,
      created.skillId,
      created.createdAt,
    );
  }
}
