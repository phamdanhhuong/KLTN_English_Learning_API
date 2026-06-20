import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { MiniGameType, ExerciseType } from '@prisma/client';

@Injectable()
export class GenerateMiniGameUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string, partId: string, gameType: MiniGameType) {
    // Kiểm tra SkillPart có tồn tại không
    let part = await this.prisma.skillPart.findUnique({
      where: { id: partId },
      include: {
        skills: {
          include: {
            lessons: {
              include: {
                exercises: true,
              },
            },
          },
        },
      },
    });

    let allExercises: any[] = [];
    if (part) {
      for (const skill of part.skills) {
        for (const lesson of skill.lessons) {
          allExercises = allExercises.concat(lesson.exercises);
        }
      }
    } else {
      // Fallback: Tìm trong Milestone (vì frontend có thể gửi Milestone ID thay vì SkillPart ID)
      const milestone = await this.prisma.milestone.findUnique({
        where: { id: partId },
        include: {
          milestoneSkills: {
            include: {
              skill: {
                include: {
                  lessons: {
                    include: { exercises: true }
                  }
                }
              }
            }
          }
        }
      });

      if (!milestone) {
        throw new NotFoundException('SkillPart or Milestone not found');
      }

      for (const ms of milestone.milestoneSkills) {
        for (const lesson of ms.skill.lessons) {
          allExercises = allExercises.concat(lesson.exercises);
        }
      }
    }

    // Lọc theo Game Type
    let allowedTypes: ExerciseType[] = [];
    if (gameType === MiniGameType.ARCADE) {
      allowedTypes = [ExerciseType.multiple_choice, ExerciseType.listen_choose];
    } else if (gameType === MiniGameType.PUZZLE) {
      allowedTypes = [ExerciseType.match, ExerciseType.translate];
    } else {
      // Default / GACHA / PORTAL
      allowedTypes = Object.values(ExerciseType);
    }

    let filteredExercises = allExercises;
    if (allowedTypes.length > 0) {
      filteredExercises = allExercises.filter(e => allowedTypes.includes(e.exerciseType as ExerciseType));
    }

    // Nếu không đủ bài tập, fallback lấy random
    if (filteredExercises.length === 0) {
      filteredExercises = allExercises;
    }

    // Shuffle
    const shuffled = filteredExercises.sort(() => 0.5 - Math.random());

    // Lấy 10 câu ngẫu nhiên
    const selectedExercises = shuffled.slice(0, 10);

    // Lấy trạng thái / kỷ lục hiện tại
    const userMiniGame = await this.prisma.userMiniGame.findUnique({
      where: {
        userId_partId_gameType: {
          userId,
          partId,
          gameType,
        },
      },
    });

    return {
      gameType,
      partId,
      bestStars: userMiniGame?.stars || 0,
      bestScore: userMiniGame?.bestScore || 0,
      bestTimeMs: userMiniGame?.bestTimeMs || null,
      exercises: selectedExercises,
    };
  }
}
