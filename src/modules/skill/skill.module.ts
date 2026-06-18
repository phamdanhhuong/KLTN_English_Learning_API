import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { RedisModule } from '../../infrastructure/cache/redis.module';
import { AuthModule } from '../auth/auth.module';

// Controllers
import { SkillController } from './presentation/controllers/skill.controller';
import { SkillPartController } from './presentation/controllers/skill-part.controller';
import { LessonController } from './presentation/controllers/lesson.controller';
import { ExerciseController } from './presentation/controllers/exercise.controller';
import { RoadmapController } from './presentation/controllers/roadmap.controller';
import { MilestoneController } from './presentation/controllers/milestone.controller';

// Skill Use Cases
import {
  CreateSkillUseCase,
  GetAllSkillsUseCase,
  GetSkillByIdUseCase,
  UpdateSkillUseCase,
  DeleteSkillUseCase,
  ValidateSkillStructureUseCase,
} from './application/use-cases/skill';

// Skill Part Use Cases
import {
  GetAllSkillPartsUseCase,
  GetAllSkillPartsWithProgressUseCase,
  GetSkillPartByIdUseCase,
  CreateSkillPartUseCase,
  UpdateSkillPartUseCase,
  DeleteSkillPartUseCase,
} from './application/use-cases/skill-part';

// Lesson Use Cases
import {
  GetLessonByIdUseCase,
  GetLessonsBySkillLevelUseCase,
  GetLessonsBySkillIdUseCase,
  CreateLessonUseCase,
  UpdateLessonUseCase,
  DeleteLessonUseCase,
} from './application/use-cases/lesson';

// Exercise Use Cases
import {
  GetExerciseByIdUseCase,
  GetExercisesByLessonIdUseCase,
  CreateExerciseUseCase,
  CreateManyExercisesUseCase,
  UpdateExerciseUseCase,
  DeleteExerciseUseCase,
  DeleteExercisesByLessonIdUseCase,
  GetExerciseCountUseCase,
  GetReviewExercisesUseCase,
  GetTrainingExercisesUseCase,
  GenerateAiExercisesUseCase,
} from './application/use-cases/exercise';

// Roadmap Use Cases
import {
  CreateRoadmapUseCase,
  GetAllRoadmapsUseCase,
  GetRoadmapByIdUseCase,
  UpdateRoadmapUseCase,
  DeleteRoadmapUseCase,
  GetActiveUserRoadmapUseCase,
} from './application/use-cases/roadmap';

// Milestone Use Cases
import {
  CreateMilestoneUseCase,
  GetMilestonesByRoadmapUseCase,
  GetMilestoneByIdUseCase,
  UpdateMilestoneUseCase,
  DeleteMilestoneUseCase,
} from './application/use-cases/milestone';

// Application Services
import { ExerciseMetaValidatorService } from './application/services/exercise-meta-validator.service';

// Infrastructure - Repositories
import { PrismaSkillRepository } from './infrastructure/repositories/prisma-skill.repository';
import { PrismaSkillLevelRepository } from './infrastructure/repositories/prisma-skill-level.repository';
import { PrismaSkillPartRepository } from './infrastructure/repositories/prisma-skill-part.repository';
import { PrismaLessonRepository } from './infrastructure/repositories/prisma-lesson.repository';
import { PrismaExerciseRepository } from './infrastructure/repositories/prisma-exercise.repository';
import { PrismaReviewExerciseRepository } from './infrastructure/repositories/prisma-review-exercise.repository';
import { PrismaTrainingExerciseRepository } from './infrastructure/repositories/prisma-training-exercise.repository';
import { PrismaUserCustomSkillRepository } from './infrastructure/repositories/prisma-user-custom-skill.repository';
import { PrismaRoadmapRepository } from './infrastructure/repositories/prisma-roadmap.repository';
import { PrismaMilestoneRepository } from './infrastructure/repositories/prisma-milestone.repository';

// Infrastructure - Domain Service
import { SkillDomainServiceImpl } from './infrastructure/services/skill-domain.service';
import { AiExerciseGeneratorServiceImpl } from './infrastructure/services/ai-exercise-generator.service';

// DI Tokens
import { SKILL_TOKENS } from './domain/di/tokens';

// All use case classes for convenience
const skillUseCases = [
  CreateSkillUseCase,
  GetAllSkillsUseCase,
  GetSkillByIdUseCase,
  UpdateSkillUseCase,
  DeleteSkillUseCase,
  ValidateSkillStructureUseCase,
];

const skillPartUseCases = [
  GetAllSkillPartsUseCase,
  GetAllSkillPartsWithProgressUseCase,
  GetSkillPartByIdUseCase,
  CreateSkillPartUseCase,
  UpdateSkillPartUseCase,
  DeleteSkillPartUseCase,
];

const lessonUseCases = [
  GetLessonByIdUseCase,
  GetLessonsBySkillLevelUseCase,
  GetLessonsBySkillIdUseCase,
  CreateLessonUseCase,
  UpdateLessonUseCase,
  DeleteLessonUseCase,
];

const exerciseUseCases = [
  GetExerciseByIdUseCase,
  GetExercisesByLessonIdUseCase,
  CreateExerciseUseCase,
  CreateManyExercisesUseCase,
  UpdateExerciseUseCase,
  DeleteExerciseUseCase,
  DeleteExercisesByLessonIdUseCase,
  GetExerciseCountUseCase,
  GetReviewExercisesUseCase,
  GetTrainingExercisesUseCase,
  GenerateAiExercisesUseCase,
];

const roadmapUseCases = [
  CreateRoadmapUseCase,
  GetAllRoadmapsUseCase,
  GetRoadmapByIdUseCase,
  UpdateRoadmapUseCase,
  DeleteRoadmapUseCase,
  GetActiveUserRoadmapUseCase,
];

const milestoneUseCases = [
  CreateMilestoneUseCase,
  GetMilestonesByRoadmapUseCase,
  GetMilestoneByIdUseCase,
  UpdateMilestoneUseCase,
  DeleteMilestoneUseCase,
];

@Module({
  imports: [RedisModule, AuthModule, HttpModule],
  controllers: [
    SkillController,
    SkillPartController,
    LessonController,
    ExerciseController,
    RoadmapController,
    MilestoneController,
  ],
  providers: [
    // Repository implementations
    {
      provide: SKILL_TOKENS.SKILL_REPOSITORY,
      useClass: PrismaSkillRepository,
    },
    {
      provide: SKILL_TOKENS.SKILL_LEVEL_REPOSITORY,
      useClass: PrismaSkillLevelRepository,
    },
    {
      provide: SKILL_TOKENS.SKILL_PART_REPOSITORY,
      useClass: PrismaSkillPartRepository,
    },
    {
      provide: SKILL_TOKENS.LESSON_REPOSITORY,
      useClass: PrismaLessonRepository,
    },
    {
      provide: SKILL_TOKENS.EXERCISE_REPOSITORY,
      useClass: PrismaExerciseRepository,
    },
    {
      provide: SKILL_TOKENS.REVIEW_EXERCISE_REPOSITORY,
      useClass: PrismaReviewExerciseRepository,
    },
    {
      provide: SKILL_TOKENS.TRAINING_EXERCISE_REPOSITORY,
      useClass: PrismaTrainingExerciseRepository,
    },
    {
      provide: SKILL_TOKENS.USER_CUSTOM_SKILL_REPOSITORY,
      useClass: PrismaUserCustomSkillRepository,
    },
    {
      provide: SKILL_TOKENS.ROADMAP_REPOSITORY,
      useClass: PrismaRoadmapRepository,
    },
    {
      provide: SKILL_TOKENS.MILESTONE_REPOSITORY,
      useClass: PrismaMilestoneRepository,
    },

    // Domain Services
    {
      provide: SKILL_TOKENS.SKILL_DOMAIN_SERVICE,
      useClass: SkillDomainServiceImpl,
    },
    {
      provide: SKILL_TOKENS.AI_EXERCISE_GENERATOR_SERVICE,
      useClass: AiExerciseGeneratorServiceImpl,
    },

    // Use Cases
    ...skillUseCases,
    ...skillPartUseCases,
    ...lessonUseCases,
    ...exerciseUseCases,
    ...roadmapUseCases,
    ...milestoneUseCases,

    // Application Services
    ExerciseMetaValidatorService,
  ],
  exports: [
    ...skillUseCases,
    ...skillPartUseCases,
    ...lessonUseCases,
    ...exerciseUseCases,
    ...roadmapUseCases,
    ...milestoneUseCases,
    SKILL_TOKENS.SKILL_REPOSITORY,
    SKILL_TOKENS.SKILL_PART_REPOSITORY,
    SKILL_TOKENS.LESSON_REPOSITORY,
    SKILL_TOKENS.EXERCISE_REPOSITORY,
    SKILL_TOKENS.REVIEW_EXERCISE_REPOSITORY,
    SKILL_TOKENS.TRAINING_EXERCISE_REPOSITORY,
    SKILL_TOKENS.USER_CUSTOM_SKILL_REPOSITORY,
    SKILL_TOKENS.ROADMAP_REPOSITORY,
    SKILL_TOKENS.MILESTONE_REPOSITORY,
    SKILL_TOKENS.SKILL_DOMAIN_SERVICE,
    SKILL_TOKENS.AI_EXERCISE_GENERATOR_SERVICE,
  ],
})
export class SkillModule {}
