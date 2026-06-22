import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma.service';

@Injectable()
export class GetUserRoadmapHistoryUseCase {
  private readonly logger = new Logger(GetUserRoadmapHistoryUseCase.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string): Promise<any> {
    const userRoadmaps = await this.prisma.userRoadmap.findMany({
      where: { userId },
      include: {
        roadmap: {
          select: {
            id: true,
            title: true,
            description: true,
            targetGoal: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    return userRoadmaps.map((ur) => ({
      roadmapId: ur.roadmapId,
      status: ur.status,
      startedAt: ur.startedAt,
      completedAt: ur.completedAt,
      title: ur.roadmap.title,
      description: ur.roadmap.description,
      targetGoal: ur.roadmap.targetGoal,
      isActive: ur.roadmap.isActive,
    }));
  }
}
