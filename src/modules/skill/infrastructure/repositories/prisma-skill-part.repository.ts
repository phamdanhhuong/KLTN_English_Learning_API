import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import type { SkillPartRepository } from '../../domain/repositories/skill-part.repository.interface';
import { SkillPart } from '../../domain/entities/skill-part.entity';

@Injectable()
export class PrismaSkillPartRepository implements SkillPartRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<SkillPart[]> {
    const skillParts = await this.prisma.skillPart.findMany({
      orderBy: { position: 'asc' },
      include: {
        skills: { orderBy: { position: 'asc' } },
      },
    });
    return skillParts.map((sp) => this.mapToEntity(sp));
  }

  async findById(id: string): Promise<SkillPart | null> {
    const skillPart = await this.prisma.skillPart.findUnique({
      where: { id },
      include: {
        skills: { orderBy: { position: 'asc' } },
      },
    });
    return skillPart ? this.mapToEntity(skillPart) : null;
  }

  async create(skillPart: SkillPart): Promise<SkillPart> {
    const created = await this.prisma.skillPart.create({
      data: {
        id: skillPart.id,
        name: skillPart.name,
        description: skillPart.description,
        position: skillPart.position,
        createdAt: skillPart.createdAt,
        updatedAt: skillPart.updatedAt,
      },
      include: {
        skills: { orderBy: { position: 'asc' } },
      },
    });
    return this.mapToEntity(created);
  }

  async update(skillPart: SkillPart): Promise<SkillPart> {
    const updated = await this.prisma.skillPart.update({
      where: { id: skillPart.id },
      data: {
        name: skillPart.name,
        description: skillPart.description,
        position: skillPart.position,
        updatedAt: skillPart.updatedAt,
      },
      include: {
        skills: { orderBy: { position: 'asc' } },
      },
    });
    return this.mapToEntity(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.skillPart.delete({ where: { id } });
  }

  private mapToEntity(data: any): SkillPart {
    return new SkillPart(
      data.id,
      data.name,
      data.description,
      data.position,
      data.createdAt,
      data.updatedAt,
      data.skills?.map((skill: any) => ({
        id: skill.id,
        title: skill.title,
        description: skill.description,
        position: skill.position,
        createdAt: skill.createdAt,
        updatedAt: skill.updatedAt,
      })),
    );
  }
}
