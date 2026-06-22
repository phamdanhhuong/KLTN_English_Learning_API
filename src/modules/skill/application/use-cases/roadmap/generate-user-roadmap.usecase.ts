import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma.service';
import { ChatbotClient } from '../../../../auth/infrastructure/services/chatbot.client';
import { ProficiencyLevel, LearningGoal } from '@prisma/client';
import { GenerateUserRoadmapDto } from '../../dto/roadmap.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class GenerateUserRoadmapUseCase {
  private readonly logger = new Logger(GenerateUserRoadmapUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly chatbotClient: ChatbotClient,
  ) {}

  async execute(userId: string, dto?: GenerateUserRoadmapDto): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update user profile permanently if DTO is provided
    let { targetLanguage, proficiencyLevel, learningGoals, dailyGoalMinutes } = user;
    if (dto && Object.keys(dto).length > 0) {
      targetLanguage = dto.targetLanguage ?? targetLanguage;
      proficiencyLevel = dto.proficiencyLevel ?? proficiencyLevel;
      learningGoals = dto.learningGoals ?? learningGoals;
      dailyGoalMinutes = dto.dailyGoalMinutes ?? dailyGoalMinutes;

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          targetLanguage,
          proficiencyLevel,
          learningGoals,
          dailyGoalMinutes,
        },
      });
      this.logger.log(`Updated user ${userId} preferences before roadmap generation`);
    }

    let matchingRoadmap: any = null;

    // Load all active roadmaps (basic info) to send to AI
    const activeRoadmaps = await this.prisma.roadmap.findMany({
      where: { isActive: true },
      select: { id: true, title: true, targetGoal: true },
    });

    // Ask AI to recommend the best roadmap
    if (activeRoadmaps.length > 0) {
      try {
        const aiResult = await this.chatbotClient.recommendRoadmap({
          targetLanguage: targetLanguage ?? undefined,
          proficiencyLevel: proficiencyLevel ?? undefined,
          learningGoals: learningGoals || [],
          dailyGoalMinutes: dailyGoalMinutes || 15,
          existingRoadmaps: activeRoadmaps,
        });

        if (aiResult?.roadmapId) {
          matchingRoadmap = await this.prisma.roadmap.findUnique({
            where: { id: aiResult.roadmapId },
            include: {
              milestones: {
                orderBy: { order: 'asc' },
                include: { milestoneSkills: true },
              },
            },
          });
          this.logger.log(`AI recommended roadmap: ${aiResult.roadmapId}`);
        }
      } catch (aiError) {
        this.logger.warn(`AI roadmap recommendation failed, falling back to DB match: ${aiError.message}`);
      }
    }

    // Deterministic fallback: match by learning goals
    if (!matchingRoadmap && learningGoals && learningGoals.length > 0) {
      matchingRoadmap = await this.prisma.roadmap.findFirst({
        where: {
          targetGoal: { in: learningGoals as LearningGoal[] },
          isActive: true,
        },
        include: {
          milestones: {
            orderBy: { order: 'asc' },
            include: { milestoneSkills: true },
          },
        },
      });
    }

    // Last resort fallback: generate a roadmap using AI
    if (!matchingRoadmap) {
      try {
        this.logger.log('No matching roadmap found, asking AI to generate one...');
        const generatedRoadmap = await this.chatbotClient.generateRoadmap({
          targetLanguage: targetLanguage ?? undefined,
          proficiencyLevel: proficiencyLevel ?? undefined,
          learningGoals: learningGoals || [],
          dailyGoalMinutes: dailyGoalMinutes || 15,
        });

        // Create the roadmap in DB
        matchingRoadmap = await this.prisma.roadmap.create({
          data: {
            title: generatedRoadmap.title,
            targetGoal: generatedRoadmap.targetGoal as LearningGoal,
            description: generatedRoadmap.description,
            isActive: true,
            milestones: {
              create: generatedRoadmap.milestones.map((m) => ({
                title: m.title,
                targetLevel: m.targetLevel as ProficiencyLevel,
                order: m.order,
              })),
            },
          },
          include: {
            milestones: {
              orderBy: { order: 'asc' },
              include: { milestoneSkills: true },
            },
          },
        });
        this.logger.log(`Created AI-generated roadmap: ${matchingRoadmap.id}`);
      } catch (error) {
        this.logger.error(`Failed to generate roadmap: ${error.message}`);
      }
    }

    // If absolutely no roadmap, fallback to the very first one
    if (!matchingRoadmap) {
      matchingRoadmap = await this.prisma.roadmap.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
        include: {
          milestones: {
            orderBy: { order: 'asc' },
            include: { milestoneSkills: true },
          },
        },
      });
    }

    if (!matchingRoadmap) {
      throw new Error('Failed to generate or find a roadmap for the user');
    }

    // Abandon old roadmap
    await this.prisma.userRoadmap.updateMany({
      where: {
        userId,
        status: 'IN_PROGRESS',
      },
      data: {
        status: 'ABANDONED',
      },
    });

    // Assign the new Roadmap to User (using upsert to avoid Unique constraint failure if it's the same roadmap)
    await this.prisma.userRoadmap.upsert({
      where: {
        userId_roadmapId: {
          userId,
          roadmapId: matchingRoadmap.id,
        },
      },
      create: {
        userId,
        roadmapId: matchingRoadmap.id,
        status: 'IN_PROGRESS',
      },
      update: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        completedAt: null,
      },
    });

    this.logger.log(`Assigned Roadmap ${matchingRoadmap.id} to User ${userId}`);

    // Ensure first milestone has a skill
    const firstMilestone = matchingRoadmap.milestones[0];
    if (firstMilestone) {
      let firstSkillId: string | null = null;

      if (firstMilestone.milestoneSkills && firstMilestone.milestoneSkills.length > 0) {
        firstSkillId = firstMilestone.milestoneSkills[0].skillId;
      } else {
        // Generate a skill using AI
        firstSkillId = await this.initializeFirstSkill(
          firstMilestone.id,
          firstMilestone.title,
          firstMilestone.targetLevel,
          proficiencyLevel ?? undefined,
          learningGoals || [],
          1, // first skill, position 1
        );
      }

      if (firstSkillId) {
        // Reset skill progress
        await this.prisma.skillProgress.upsert({
          where: { userId },
          create: {
            userId,
            skillId: firstSkillId,
            levelReached: 1,
            lessonPosition: 1,
          },
          update: {
            skillId: firstSkillId,
            levelReached: 1,
            lessonPosition: 1,
          },
        });

        this.logger.log(`Reset SkillProgress for User ${userId} to Skill ${firstSkillId}`);
      }
    }

    return matchingRoadmap;
  }

  private async initializeFirstSkill(
    milestoneId: string,
    milestoneTitle: string,
    targetLevel: ProficiencyLevel,
    proficiencyLevel: string | undefined,
    learningGoals: string[],
    position: number,
  ): Promise<string | null> {
    try {
      this.logger.log(`Generating first skill for milestone ${milestoneId}...`);
      const generatedSkill = await this.chatbotClient.generateSkill({
        milestoneTitle,
        milestoneTargetLevel: targetLevel,
        proficiencyLevel,
        learningGoals,
        skillIndex: position,
      });

      // Save skill to DB
      const skillId = uuidv4();
      
      // Find or create AI Generated skill part
      let skillPart = await this.prisma.skillPart.findFirst({
        where: { name: 'AI Generated' }
      });
      if (!skillPart) {
        skillPart = await this.prisma.skillPart.create({
          data: { name: 'AI Generated', description: 'Skills generated by AI' }
        });
      }

      const uniqueLevels = [...new Set(generatedSkill.lessons.map((l: any) => l.level))];

      await this.prisma.skill.create({
        data: {
          id: skillId,
          partId: skillPart.id,
          title: generatedSkill.title,
          description: generatedSkill.description,
          position: position,
          skillLevels: {
            create: uniqueLevels.map((level) => ({ level: level as number })),
          },
          lessons: {
            create: generatedSkill.lessons.map((l: any) => ({
              skillLevel: l.level,
              title: l.title,
              position: l.position,
            })),
          },
        },
      });

      // Link to milestone
      await this.prisma.milestoneSkill.create({
        data: {
          milestoneId,
          skillId,
        },
      });

      return skillId;
    } catch (error) {
      this.logger.error(`Failed to generate first skill: ${error.message}`);
      return null;
    }
  }
}
