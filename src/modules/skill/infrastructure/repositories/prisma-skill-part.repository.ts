import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import type { SkillPartRepository, SkillPartWithProgress } from '../../domain/repositories/skill-part.repository.interface';
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

  async findWithProgress(userId: string): Promise<SkillPartWithProgress[]> {
    // Lấy skill progress hiện tại của user
    const userProgress = await this.prisma.skillProgress.findUnique({
      where: { userId },
      include: { skill: true },
    });

    // Lấy tất cả skill parts với skills và grammar
    const skillParts = await this.prisma.skillPart.findMany({
      orderBy: { position: 'asc' },
      include: {
        skills: {
          orderBy: { position: 'asc' },
          include: {
            skillGrammars: {
              include: {
                grammar: true,
              },
            },
          },
        },
      },
    });

    return skillParts.map((skillPart) => {
      const totalSkills = skillPart.skills.length;
      let completedSkills = 0;
      let currentSkill:
        | { id: string; title: string; position: number }
        | undefined = undefined;

      if (userProgress && totalSkills > 0) {
        const currentSkillInPart = skillPart.skills.find(
          (s) => s.id === userProgress.skillId,
        );

        if (currentSkillInPart) {
          // User đang học skill trong part này
          completedSkills = skillPart.skills.filter(
            (s) => s.position < currentSkillInPart.position,
          ).length;
          currentSkill = {
            id: currentSkillInPart.id,
            title: currentSkillInPart.title,
            position: currentSkillInPart.position,
          };
        } else {
          // Kiểm tra xem part này đã hoàn thành chưa
          const currentSkillPartPosition = skillPart.position;

          // Tìm part của skill hiện tại
          const currentSkillPart = skillParts.find((sp) =>
            sp.skills.some((s) => s.id === userProgress.skillId),
          );

          if (
            currentSkillPart &&
            currentSkillPart.position > currentSkillPartPosition
          ) {
            // Part này đã hoàn thành (part hiện tại có position cao hơn)
            completedSkills = totalSkills;
          }
          // Nếu không thì completedSkills = 0 (chưa bắt đầu part này)
        }
      }

      const progressPercentage =
        totalSkills > 0 ? Math.round((completedSkills / totalSkills) * 100) : 0;

      // Map skills với grammar information
      const skillsWithGrammar = skillPart.skills.map((skill) => ({
        id: skill.id,
        title: skill.title,
        description: skill.description || undefined,
        position: skill.position,
        grammars: skill.skillGrammars.map((sg) => ({
          id: sg.grammar.id,
          rule: sg.grammar.rule,
          explanation: sg.grammar.explanation || undefined,
          examples: sg.grammar.examples,
        })),
      }));

      return {
        id: skillPart.id,
        name: skillPart.name,
        description: skillPart.description || undefined,
        position: skillPart.position,
        createdAt: skillPart.createdAt,
        updatedAt: skillPart.updatedAt,
        totalSkills,
        completedSkills,
        progressPercentage,
        currentSkill,
        skills: skillsWithGrammar,
      };
    });
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
