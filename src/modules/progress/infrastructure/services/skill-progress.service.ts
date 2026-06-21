import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import type { SkillProgressServiceInterface } from '../../domain/services/skill-progress.service.interface';
import { ChatbotClient } from '../../../auth/infrastructure/services/chatbot.client';

@Injectable()
export class SkillProgressService implements SkillProgressServiceInterface {
  private readonly logger = new Logger(SkillProgressService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly chatbotClient: ChatbotClient,
  ) {}

  async updateSkillProgress(
    userId: string,
    skillId: string,
    completedLessonId: string,
  ): Promise<string | null> {
    try {
      // Get current skill progress
      const skillProgress = await this.prisma.skillProgress.findUnique({
        where: { userId },
      });

      // Nếu chưa có progress hoặc skill khác → tạo mới
      if (!skillProgress || skillProgress.skillId !== skillId) {
        await this.prisma.skillProgress.upsert({
          where: { userId },
          create: {
            userId,
            skillId,
            levelReached: 1,
            lessonPosition: 1,
            lastPracticed: new Date(),
          },
          update: {
            skillId,
            levelReached: 1,
            lessonPosition: 1,
            lastPracticed: new Date(),
          },
        });
        return 'Started new skill progress.';
      }

      // Get lesson thông tin
      const currentLesson = await this.prisma.lesson.findUnique({
        where: { id: completedLessonId },
      });
      if (!currentLesson) return null;

      // Kiểm tra bài nộp có phải bài hiện tại
      const isCurrentProgressLesson =
        currentLesson.skillLevel === skillProgress.levelReached &&
        currentLesson.position === skillProgress.lessonPosition;

      if (!isCurrentProgressLesson) return null;

      // Lấy tất cả lessons trong level hiện tại
      const currentLevelLessons = await this.prisma.lesson.findMany({
        where: { skillId, skillLevel: skillProgress.levelReached },
        orderBy: { position: 'asc' },
      });

      const maxLessonPosition = Math.max(
        ...currentLevelLessons.map((l) => l.position),
      );
      const isLastLessonInLevel = currentLesson.position >= maxLessonPosition;

      if (isLastLessonInLevel) {
        const maxLevel = 7;
        if (skillProgress.levelReached < maxLevel) {
          // Lên level tiếp theo
          await this.prisma.skillProgress.update({
            where: { userId },
            data: {
              levelReached: skillProgress.levelReached + 1,
              lessonPosition: 1,
              lastPracticed: new Date(),
            },
          });
          return `Advanced to level ${skillProgress.levelReached + 1}!`;
        } else {
          // Hết skill → tìm skill tiếp theo
          const currentSkill = await this.prisma.skill.findUnique({
            where: { id: skillId },
          });
          if (!currentSkill) return 'Congratulations! All skills completed!';

          let nextSkill: any = null;
          let roadmapCompleted = false;

          // 1. Kiểm tra xem user có đang học roadmap nào không
          const activeUserRoadmap = await this.prisma.userRoadmap.findFirst({
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

          if (activeUserRoadmap) {
            // Lấy danh sách skill trong roadmap theo thứ tự milestone và position của skill
            const orderedSkills: any[] = [];
            for (const milestone of activeUserRoadmap.roadmap.milestones) {
              const skillsInMilestone = milestone.milestoneSkills
                .map((ms) => ms.skill)
                .sort((a, b) => a.position - b.position);
              orderedSkills.push(...skillsInMilestone);
            }

            const currentIndex = orderedSkills.findIndex((s) => s.id === skillId);
            if (currentIndex !== -1) {
              if (currentIndex < orderedSkills.length - 1) {
                nextSkill = orderedSkills[currentIndex + 1];
              } else {
                // Determine if there is a next milestone that hasn't been generated
                const currentMilestoneIndex = activeUserRoadmap.roadmap.milestones.findIndex(
                  (m) => m.milestoneSkills.some((ms) => ms.skillId === skillId)
                );

                if (currentMilestoneIndex !== -1 && currentMilestoneIndex < activeUserRoadmap.roadmap.milestones.length - 1) {
                  const nextMilestone = activeUserRoadmap.roadmap.milestones[currentMilestoneIndex + 1];

                  if (nextMilestone.milestoneSkills.length === 0) {
                    // Generate skill for the next milestone
                    try {
                      this.logger.log(`Generating next skill for milestone: ${nextMilestone.title}`);
                      
                      // Find learning goals from user profile or default
                      const userProfile = await this.prisma.user.findUnique({ where: { id: userId } });
                      const learningGoals = userProfile?.learningGoals as string[] | undefined;
                      const proficiencyLevel = userProfile?.proficiencyLevel || undefined;

                      const generatedSkill = await this.chatbotClient.generateSkill({
                        milestoneTitle: nextMilestone.title,
                        milestoneTargetLevel: nextMilestone.targetLevel,
                        proficiencyLevel,
                        learningGoals,
                        skillIndex: 0,
                      });

                      let skillPart = await this.prisma.skillPart.findFirst({
                        where: { name: 'AI Generated' },
                      });

                      if (!skillPart) {
                        skillPart = await this.prisma.skillPart.create({
                          data: { name: 'AI Generated', description: 'Skills dynamically generated by AI', position: 999 },
                        });
                      }

                      const uniqueLevels = [...new Set(generatedSkill.lessons.map((l) => l.level))];

                      const newSkill = await this.prisma.skill.create({
                        data: {
                          title: generatedSkill.title,
                          description: generatedSkill.description,
                          position: orderedSkills[orderedSkills.length - 1].position + 1, // continue sequence
                          partId: skillPart.id,
                          skillLevels: {
                            create: uniqueLevels.map((level) => ({ level })),
                          },
                          lessons: {
                            create: generatedSkill.lessons.map((l) => ({
                              skillLevel: l.level,
                              title: l.title,
                              position: l.position,
                            })),
                          },
                          milestoneSkills: {
                            create: [{ milestoneId: nextMilestone.id }],
                          },
                        },
                      });

                      nextSkill = newSkill;
                      this.logger.log(`Created next AI-generated skill: ${newSkill.id}`);
                    } catch (error) {
                      this.logger.error(`Failed to generate next skill: ${error.message}`);
                    }
                  }
                }

                if (!nextSkill) {
                  roadmapCompleted = true;
                  // Hoàn thành roadmap
                  await this.prisma.userRoadmap.update({
                    where: {
                      userId_roadmapId: {
                        userId,
                        roadmapId: activeUserRoadmap.roadmapId,
                      },
                    },
                    data: {
                      status: 'COMPLETED',
                      completedAt: new Date(),
                    },
                  });
                }
              }
            }
          }

          // 2. Nếu không có nextSkill từ roadmap (do không học roadmap, hoặc skill không nằm trong roadmap)
          // và chưa hoàn thành roadmap, thì fallback về default
          if (!nextSkill && !roadmapCompleted) {
            nextSkill = await this.prisma.skill.findFirst({
              where: { position: { gt: currentSkill.position } },
              orderBy: { position: 'asc' },
            });
          }

          if (nextSkill) {
            await this.prisma.skillProgress.update({
              where: { userId },
              data: {
                skillId: nextSkill.id,
                levelReached: 1,
                lessonPosition: 1,
                lastPracticed: new Date(),
              },
            });
            return `Skill completed! Started new skill: ${nextSkill.title}`;
          } else if (roadmapCompleted) {
            return 'Congratulations! You have completed your roadmap!';
          } else {
            return 'Congratulations! All skills completed!';
          }
        }
      } else {
        // Bài tiếp theo trong level hiện tại
        await this.prisma.skillProgress.update({
          where: { userId },
          data: {
            lessonPosition: currentLesson.position + 1,
            lastPracticed: new Date(),
          },
        });
        return `Advanced to lesson ${currentLesson.position + 1} in level ${skillProgress.levelReached}.`;
      }
    } catch (error) {
      console.error('Error updating skill progress:', error);
      return null;
    }
  }

  generateProgressMessage(
    correctExercises: number,
    totalExercises: number,
    lessonAccuracy: number,
    wordMasteriesUpdated: number,
    grammarMasteriesUpdated: number,
  ): string {
    return `Lesson completed with ${correctExercises}/${totalExercises} correct exercises (${Math.round(
      lessonAccuracy * 100,
    )}% accuracy). Updated ${wordMasteriesUpdated} word masteries and ${grammarMasteriesUpdated} grammar masteries.`;
  }
}
