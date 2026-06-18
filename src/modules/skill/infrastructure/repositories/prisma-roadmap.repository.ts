import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import type { RoadmapRepository as RoadmapRepositoryInterface } from '../../domain/repositories/roadmap.repository.interface';
import { Roadmap } from '../../domain/entities/roadmap.entity';
import { Milestone } from '../../domain/entities/milestone.entity';

@Injectable()
export class PrismaRoadmapRepository implements RoadmapRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Roadmap[]> {
    const roadmaps = await this.prisma.roadmap.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return roadmaps.map((r: any) => this.toDomain(r));
  }

  async findById(id: string): Promise<Roadmap | null> {
    const roadmap = await this.prisma.roadmap.findUnique({
      where: { id },
      include: {
        milestones: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return roadmap ? this.toDomain(roadmap) : null;
  }

  async create(roadmap: Roadmap): Promise<Roadmap> {
    const created = await this.prisma.roadmap.create({
      data: {
        id: roadmap.id,
        title: roadmap.title,
        targetGoal: roadmap.targetGoal as any,
        description: roadmap.description,
        isActive: roadmap.isActive,
        createdAt: roadmap.createdAt,
      },
    });

    return this.toDomain(created);
  }

  async update(roadmap: Roadmap): Promise<Roadmap> {
    const updated = await this.prisma.roadmap.update({
      where: { id: roadmap.id },
      data: {
        title: roadmap.title,
        targetGoal: roadmap.targetGoal as any,
        description: roadmap.description,
        isActive: roadmap.isActive,
      },
    });

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.roadmap.delete({ where: { id } });
  }

  async findActiveUserRoadmap(userId: string): Promise<any | null> {
    return this.prisma.userRoadmap.findFirst({
      where: { userId, status: 'IN_PROGRESS' },
      include: {
        roadmap: {
          include: {
            milestones: {
              orderBy: { order: 'asc' },
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
    });
  }

  private toDomain(data: any): Roadmap {
    const milestones = data.milestones?.map(
      (m: any) =>
        new Milestone(
          m.id,
          m.roadmapId,
          m.title,
          m.targetLevel,
          m.order,
          m.capstoneTestId,
        ),
    );

    return new Roadmap(
      data.id,
      data.title,
      data.targetGoal,
      data.description,
      data.isActive,
      data.createdAt,
      milestones,
    );
  }
}
