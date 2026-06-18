import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import type { MilestoneRepository as MilestoneRepositoryInterface } from '../../domain/repositories/milestone.repository.interface';
import { Milestone } from '../../domain/entities/milestone.entity';

@Injectable()
export class PrismaMilestoneRepository implements MilestoneRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByRoadmapId(roadmapId: string): Promise<Milestone[]> {
    const milestones = await this.prisma.milestone.findMany({
      where: { roadmapId },
      orderBy: { order: 'asc' },
    });
    return milestones.map((m: any) => this.toDomain(m));
  }

  async findById(id: string): Promise<Milestone | null> {
    const milestone = await this.prisma.milestone.findUnique({
      where: { id },
    });

    return milestone ? this.toDomain(milestone) : null;
  }

  async create(milestone: Milestone): Promise<Milestone> {
    const created = await this.prisma.milestone.create({
      data: {
        id: milestone.id,
        roadmapId: milestone.roadmapId,
        title: milestone.title,
        targetLevel: milestone.targetLevel as any,
        order: milestone.order,
        capstoneTestId: milestone.capstoneTestId,
      },
    });

    return this.toDomain(created);
  }

  async update(milestone: Milestone): Promise<Milestone> {
    const updated = await this.prisma.milestone.update({
      where: { id: milestone.id },
      data: {
        title: milestone.title,
        targetLevel: milestone.targetLevel as any,
        order: milestone.order,
        capstoneTestId: milestone.capstoneTestId,
      },
    });

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.milestone.delete({ where: { id } });
  }

  private toDomain(data: any): Milestone {
    return new Milestone(
      data.id,
      data.roadmapId,
      data.title,
      data.targetLevel,
      data.order,
      data.capstoneTestId,
    );
  }
}
