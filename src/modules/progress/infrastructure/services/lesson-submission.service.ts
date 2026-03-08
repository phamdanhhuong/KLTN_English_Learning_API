import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import type { LessonSubmissionServiceInterface } from '../../domain/services/lesson-submission.service.interface';

@Injectable()
export class LessonSubmissionService implements LessonSubmissionServiceInterface {
  constructor(private readonly prisma: PrismaService) {}

  async getExerciseDataMaps(exercises: any[]): Promise<{
    wordsMap: Map<string, string[]>;
    grammarsMap: Map<string, string[]>;
  }> {
    const exerciseIds = exercises.map((e) => e.exerciseId);

    const [exerciseWords, exerciseGrammars] = await Promise.all([
      this.prisma.exerciseWord.findMany({
        where: { exerciseId: { in: exerciseIds } },
        select: { exerciseId: true, wordId: true },
      }),
      this.prisma.exerciseGrammar.findMany({
        where: { exerciseId: { in: exerciseIds } },
        select: { exerciseId: true, grammarId: true },
      }),
    ]);

    const wordsMap = new Map<string, string[]>();
    for (const ew of exerciseWords) {
      const existing = wordsMap.get(ew.exerciseId) || [];
      existing.push(ew.wordId);
      wordsMap.set(ew.exerciseId, existing);
    }

    const grammarsMap = new Map<string, string[]>();
    for (const eg of exerciseGrammars) {
      const existing = grammarsMap.get(eg.exerciseId) || [];
      existing.push(eg.grammarId);
      grammarsMap.set(eg.exerciseId, existing);
    }

    return { wordsMap, grammarsMap };
  }

  calculateLessonPerformance(exercises: any[]): {
    correctExercises: number;
    totalExercises: number;
    lessonAccuracy: number;
    isLessonSuccessful: boolean;
  } {
    const totalExercises = exercises.length;
    const correctExercises = exercises.filter(
      (e) => e.isCorrect && e.incorrectCount === 0,
    ).length;
    const lessonAccuracy = totalExercises > 0 ? correctExercises / totalExercises : 0;
    const isLessonSuccessful = exercises.every((e) => e.isCorrect);

    return { correctExercises, totalExercises, lessonAccuracy, isLessonSuccessful };
  }

  async saveExerciseResults(userId: string, exercises: any[]): Promise<void> {
    for (const exercise of exercises) {
      const existing = await this.prisma.exerciseResult.findFirst({
        where: { userId, exerciseId: exercise.exerciseId },
      });

      if (existing) {
        await this.prisma.exerciseResult.update({
          where: { id: existing.id },
          data: {
            correctCount: existing.correctCount + (exercise.isCorrect ? 1 : 0),
            incorrectCount: existing.incorrectCount + exercise.incorrectCount,
          },
        });
      } else {
        await this.prisma.exerciseResult.create({
          data: {
            userId,
            exerciseId: exercise.exerciseId,
            correctCount: exercise.isCorrect ? 1 : 0,
            incorrectCount: exercise.incorrectCount,
          },
        });
      }
    }
  }

  async validateLessonProgress(
    userId: string,
    skillId: string,
    lessonId: string,
  ): Promise<boolean> {
    try {
      const skillProgress = await this.prisma.skillProgress.findUnique({
        where: { userId },
      });

      const lesson = await this.prisma.lesson.findUnique({
        where: { id: lessonId },
      });

      if (!lesson) return false;

      // Nếu chưa có progress → cho phép lesson đầu tiên (level 1, position 1)
      if (!skillProgress || skillProgress.skillId !== skillId) {
        return lesson.skillLevel === 1 && lesson.position === 1;
      }

      // Kiểm tra lesson có phải bài hiện tại trong tiến độ không
      return (
        lesson.skillLevel === skillProgress.levelReached &&
        lesson.position === skillProgress.lessonPosition
      );
    } catch {
      return false;
    }
  }
}
