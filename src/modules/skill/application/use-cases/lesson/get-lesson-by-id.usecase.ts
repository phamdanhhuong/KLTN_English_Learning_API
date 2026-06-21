import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import type { LessonRepository } from '../../../domain/repositories/lesson.repository.interface';
import type { ExerciseRepository } from '../../../domain/repositories/exercise.repository.interface';
import { SKILL_TOKENS } from '../../../domain/di/tokens';
import { LessonDto } from '../../dto/lesson.dto';
import { LessonMapper } from '../../mappers/lesson.mapper';
import { ChatbotClient } from '../../../../auth/infrastructure/services/chatbot.client';
import { Exercise, ExerciseType } from '../../../domain/entities/exercise.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class GetLessonByIdUseCase {
  private readonly logger = new Logger(GetLessonByIdUseCase.name);

  constructor(
    @Inject(SKILL_TOKENS.LESSON_REPOSITORY)
    private readonly lessonRepository: LessonRepository,
    @Inject(SKILL_TOKENS.EXERCISE_REPOSITORY)
    private readonly exerciseRepository: ExerciseRepository,
    private readonly chatbotClient: ChatbotClient,
  ) {}

  async execute(id: string): Promise<LessonDto> {
    let lesson = await this.lessonRepository.findById(id);
    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${id} not found`);
    }

    // On-demand exercise generation
    if (!lesson.exercises || lesson.exercises.length === 0) {
      this.logger.log(`Lesson ${id} has no exercises, generating...`);
      try {
        const difficultyMap: Record<number, string> = {
          1: 'beginner',
          2: 'elementary',
          3: 'intermediate',
          4: 'intermediate',
          5: 'upper_intermediate',
          6: 'advanced',
          7: 'advanced',
        };
        const difficulty = difficultyMap[lesson.skillLevel] || 'beginner';

        const exerciseCount = lesson.skillLevel === 4 ? 1 : 5; // Podcast generates 1 massive exercise

        let allowed_types: string[] | undefined;
        if (lesson.skillLevel === 4) {
          allowed_types = ['podcast'];
        } else {
          allowed_types = [
            'translate',
            'listen_choose',
            'fill_blank',
            'speak',
            'match',
            'multiple_choice',
            'writing_prompt',
            'image_description',
            'compare_words'
          ];
        }

        // Generate exercises
        const generatedExercises = await this.chatbotClient.generateExercises({
          topic: lesson.title,
          difficulty,
          exercise_count: exerciseCount,
          allowed_types,
        });

        if (generatedExercises && generatedExercises.exercises && generatedExercises.exercises.length > 0) {
          const exercisesToSave = generatedExercises.exercises;

          const domainExercises = exercisesToSave.map((exData: any, index: number) => {
            return new Exercise(
              uuidv4(),
              lesson!.id,
              exData.exerciseType as ExerciseType,
              exData.prompt,
              exData.meta,
              index + 1,
              new Date(),
            );
          });

          // Save to DB
          await this.exerciseRepository.createMany(domainExercises);

          // Invalidate lesson cache and re-fetch
          if (this.lessonRepository.invalidateCacheForLesson) {
            await this.lessonRepository.invalidateCacheForLesson(lesson.id, lesson.skillId, lesson.skillLevel);
          }
          
          const updatedLesson = await this.lessonRepository.findById(id);
          if (updatedLesson) {
            lesson = updatedLesson;
          }
          this.logger.log(`Successfully generated and saved ${domainExercises.length} exercises for lesson ${id}`);
        }
      } catch (error) {
        this.logger.error(`Failed to generate exercises for lesson ${id}: ${error.message}`);
      }
    }

    return LessonMapper.toDto(lesson);
  }
}
