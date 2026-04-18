import { Injectable, Inject, Logger } from '@nestjs/common';
import type { ExerciseRepository } from '../../../domain/repositories/exercise.repository.interface';
import type { LessonRepository } from '../../../domain/repositories/lesson.repository.interface';
import type { UserCustomSkillRepository } from '../../../domain/repositories/user-custom-skill.repository.interface';
import type { SkillPartRepository } from '../../../domain/repositories/skill-part.repository.interface';
import type { SkillDomainService } from '../../../domain/services/skill-domain.service.interface';
import type { AiExerciseGeneratorService } from '../../../domain/services/ai-exercise-generator.service.interface';
import { Exercise, ExerciseType } from '../../../domain/entities/exercise.entity';
import { Lesson } from '../../../domain/entities/lesson.entity';
import { UserCustomSkill } from '../../../domain/entities/user-custom-skill.entity';
import { SkillPart } from '../../../domain/entities/skill-part.entity';
import { ExerciseMapper } from '../../mappers/exercise.mapper';
import { SKILL_TOKENS } from '../../../domain/di/tokens';
import {
  GenerateAiExercisesDto,
  GenerateAiExercisesResponseDto,
} from '../../dto/generate-ai-exercises.dto';

@Injectable()
export class GenerateAiExercisesUseCase {
  private readonly logger = new Logger(GenerateAiExercisesUseCase.name);

  constructor(
    @Inject(SKILL_TOKENS.USER_CUSTOM_SKILL_REPOSITORY)
    private readonly userCustomSkillRepository: UserCustomSkillRepository,
    @Inject(SKILL_TOKENS.SKILL_DOMAIN_SERVICE)
    private readonly skillDomainService: SkillDomainService,
    @Inject(SKILL_TOKENS.LESSON_REPOSITORY)
    private readonly lessonRepository: LessonRepository,
    @Inject(SKILL_TOKENS.EXERCISE_REPOSITORY)
    private readonly exerciseRepository: ExerciseRepository,
    @Inject(SKILL_TOKENS.AI_EXERCISE_GENERATOR_SERVICE)
    private readonly aiExerciseGenerator: AiExerciseGeneratorService,
    @Inject(SKILL_TOKENS.SKILL_PART_REPOSITORY)
    private readonly skillPartRepository: SkillPartRepository,
  ) {}

  async execute(
    userId: string,
    dto: GenerateAiExercisesDto,
  ): Promise<GenerateAiExercisesResponseDto> {
    const topic = dto.topic || this.getRandomTopic();
    const difficulty = dto.difficulty || 'intermediate';
    const exerciseCount = dto.exerciseCount || 8;

    // 1. Call AI service FIRST (before creating any DB records)
    this.logger.log(
      `Generating exercises: topic="${topic}", difficulty="${difficulty}", count=${exerciseCount}`,
    );

    const generatedExercises = await this.aiExerciseGenerator.generateExercises(
      topic,
      difficulty,
      exerciseCount,
    );

    // 2. Find or create user's custom skill (only after AI success)
    const customSkill = await this.getOrCreateCustomSkill(userId);

    // 3. Create a new lesson in the custom skill
    const lessonTitle = `AI Practice: ${topic}`;
    const nextPosition = await this.lessonRepository.getNextAvailablePosition(
      customSkill.skillId,
      1, // always use skill level 1 for custom skills
    );

    const lesson = Lesson.create(
      customSkill.skillId,
      1, // skill level 1
      lessonTitle,
      nextPosition,
    );
    const savedLesson = await this.lessonRepository.create(lesson);

    // 4. Create exercise entities from AI response (position starts from 1)
    const exerciseEntities: Exercise[] = generatedExercises.map(
      (genEx, index) => {
        // Normalize meta: ensure exercises relying on prompt inside meta get it
        let meta = genEx.meta as any;
        if (meta && !meta.prompt && genEx.prompt) {
          meta = { ...meta, prompt: genEx.prompt };
        } else if (genEx.exerciseType === 'speak' && meta && !meta.prompt) {
          meta = { ...meta, prompt: 'Read the following sentence aloud' };
        }

        return Exercise.create(
          savedLesson.id,
          genEx.exerciseType as ExerciseType,
          genEx.prompt,
          meta,
          index + 1,
        );
      },
    );

    // 5. Save exercises to DB
    const savedExercises =
      await this.exerciseRepository.createMany(exerciseEntities);

    // 6. Invalidate lesson cache so GET /lessons/:id returns fresh data with exercises
    await this.lessonRepository.invalidateCacheForLesson(savedLesson.id, customSkill.skillId, 1);

    // 7. Build response
    return {
      lessonId: savedLesson.id,
      lessonTitle: savedLesson.title,
      skillId: customSkill.skillId,
      exercises: savedExercises.map((ex) => ({
        id: ex.id,
        exerciseType: ex.exerciseType,
        prompt: ex.prompt,
        meta: ex.meta as Record<string, any>,
        position: ex.position,
      })),
    };
  }

  private async getOrCreateCustomSkill(
    userId: string,
  ): Promise<UserCustomSkill> {
    // Check if user already has a custom skill
    const existing = await this.userCustomSkillRepository.findByUserId(userId);
    if (existing) return existing;

    // Create a dedicated SkillPart for this user's AI exercises
    this.logger.log(`Creating custom skill part and skill for user ${userId}`);
    const skillPart = SkillPart.create(
      'Luyện tập AI',
      'Bài tập được tạo bởi AI dành riêng cho bạn',
      999, // high position so it appears at the end
    );
    const createdSkillPart = await this.skillPartRepository.create(skillPart);

    // Create a new skill inside this user's skill part
    const skill = await this.skillDomainService.createSkillWithLevels(
      'AI Generated Exercises',
      'Personalized exercises generated by AI',
      0, // position within the skill part
      createdSkillPart.id, // link to the user's dedicated skill part
    );

    // Map user to skill
    const userCustomSkill = UserCustomSkill.create(userId, skill.id);
    return this.userCustomSkillRepository.create(userCustomSkill);
  }

  private getRandomTopic(): string {
    const topics = [
      'Daily Life & Routines',
      'Travel & Tourism',
      'Food & Cooking',
      'Health & Fitness',
      'Technology & Internet',
      'Education & Learning',
      'Work & Career',
      'Environment & Nature',
      'Entertainment & Media',
      'Shopping & Fashion',
      'Family & Relationships',
      'Sports & Hobbies',
      'Culture & Traditions',
      'Science & Discovery',
      'City & Transportation',
    ];
    return topics[Math.floor(Math.random() * topics.length)];
  }
}
