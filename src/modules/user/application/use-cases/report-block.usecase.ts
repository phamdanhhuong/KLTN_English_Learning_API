import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';

@Injectable()
export class ReportUserUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(reporterId: string, targetUserId: string, reason: string, description?: string) {
    if (reporterId === targetUserId) {
      throw new BadRequestException('Cannot report yourself');
    }

    const target = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) throw new BadRequestException('User not found');

    await this.prisma.userReport.create({
      data: {
        reporterId,
        reportedUserId: targetUserId,   // schema field name
        reason: 'OTHER' as any,
        description: description ?? null,
      },
    });

    return { message: 'Report submitted successfully' };
  }
}

@Injectable()
export class BlockUserUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(blockerId: string, targetUserId: string) {
    if (blockerId === targetUserId) {
      throw new BadRequestException('Cannot block yourself');
    }

    const existing = await this.prisma.userBlock.findFirst({
      where: { blockerId, blockedUserId: targetUserId },
    });
    if (!existing) {
      await this.prisma.userBlock.create({
        data: { blockerId, blockedUserId: targetUserId },
      });
    }

    return { message: 'User blocked successfully' };
  }
}

@Injectable()
export class UnblockUserUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(blockerId: string, targetUserId: string) {
    await this.prisma.userBlock.deleteMany({
      where: { blockerId, blockedUserId: targetUserId },
    });

    return { message: 'User unblocked successfully' };
  }
}
