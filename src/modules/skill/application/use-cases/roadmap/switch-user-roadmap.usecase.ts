import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma.service';

@Injectable()
export class SwitchUserRoadmapUseCase {
  private readonly logger = new Logger(SwitchUserRoadmapUseCase.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string, targetRoadmapId: string): Promise<any> {
    // 1. Check if user already has this roadmap in their history
    const targetUserRoadmap = await this.prisma.userRoadmap.findUnique({
      where: {
        userId_roadmapId: {
          userId,
          roadmapId: targetRoadmapId,
        },
      },
      include: {
        roadmap: {
          include: {
            milestones: {
              orderBy: { order: 'asc' },
              take: 1,
              include: {
                milestoneSkills: {
                  include: {
                    skill: true,
                  },
                },
              },
            },
          },
        },
      },
    }) as any;

    if (!targetUserRoadmap) {
      throw new NotFoundException('Roadmap not found in your history.');
    }

    if (targetUserRoadmap.status === 'IN_PROGRESS') {
      throw new BadRequestException('This roadmap is already active.');
    }

    // 2. Mark current IN_PROGRESS roadmaps as ABANDONED
    await this.prisma.userRoadmap.updateMany({
      where: {
        userId,
        status: 'IN_PROGRESS',
      },
      data: {
        status: 'ABANDONED',
      },
    });

    // 3. Mark the target roadmap as IN_PROGRESS
    await this.prisma.userRoadmap.update({
      where: {
        userId_roadmapId: {
          userId,
          roadmapId: targetRoadmapId,
        },
      },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        completedAt: null,
      },
    });

    // 4. Reset SkillProgress to the first skill of the target roadmap
    const firstMilestone = targetUserRoadmap.roadmap.milestones[0];
    if (firstMilestone && firstMilestone.milestoneSkills.length > 0) {
      // Find the skill with lowest position if there are multiple, or just pick the first one
      const sortedSkills = firstMilestone.milestoneSkills.map(ms => ms.skill).sort((a, b) => a.position - b.position);
      const firstSkill = sortedSkills[0];

      if (firstSkill) {
        // Reset or create skill progress using upsert to avoid unique constraint on userId
        await this.prisma.skillProgress.upsert({
          where: { userId },
          create: {
            userId,
            skillId: firstSkill.id,
            levelReached: 1,
            lessonPosition: 1,
          },
          update: {
            skillId: firstSkill.id,
            levelReached: 1,
            lessonPosition: 1,
          },
        });
        this.logger.log(`Initialized/Reset SkillProgress for Skill ${firstSkill.id}`);
      }
    }

    this.logger.log(`User ${userId} switched to roadmap ${targetRoadmapId}`);

    return { success: true, message: 'Switched roadmap successfully' };
  }
}
