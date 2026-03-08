import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import type { SkillProgressServiceInterface } from '../../domain/services/skill-progress.service.interface';

@Injectable()
export class SkillProgressService implements SkillProgressServiceInterface {
  constructor(private readonly prisma: PrismaService) {}

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

          const nextSkill = await this.prisma.skill.findFirst({
            where: { position: { gt: currentSkill.position } },
            orderBy: { position: 'asc' },
          });

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
