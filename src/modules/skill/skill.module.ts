import { Module } from '@nestjs/common';
import { RedisModule } from '../../infrastructure/cache/redis.module';
import { AuthModule } from '../auth/auth.module';

// Controllers
import { SkillController } from './presentation/controllers/skill.controller';
import { SkillPartController } from './presentation/controllers/skill-part.controller';
import { LessonController } from './presentation/controllers/lesson.controller';
import { ExerciseController } from './presentation/controllers/exercise.controller';

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
} from './application/use-cases/exercise';

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

// Infrastructure - Domain Service
import { SkillDomainServiceImpl } from './infrastructure/services/skill-domain.service';

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
];

@Module({
  imports: [RedisModule, AuthModule],
  controllers: [
    SkillController,
    SkillPartController,
    LessonController,
    ExerciseController,
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

    // Domain Service
    {
      provide: SKILL_TOKENS.SKILL_DOMAIN_SERVICE,
      useClass: SkillDomainServiceImpl,
    },

    // Use Cases
    ...skillUseCases,
    ...skillPartUseCases,
    ...lessonUseCases,
    ...exerciseUseCases,

    // Application Services
    ExerciseMetaValidatorService,
  ],
  exports: [
    ...skillUseCases,
    ...skillPartUseCases,
    ...lessonUseCases,
    ...exerciseUseCases,
    SKILL_TOKENS.SKILL_REPOSITORY,
    SKILL_TOKENS.SKILL_PART_REPOSITORY,
    SKILL_TOKENS.LESSON_REPOSITORY,
    SKILL_TOKENS.EXERCISE_REPOSITORY,
    SKILL_TOKENS.REVIEW_EXERCISE_REPOSITORY,
    SKILL_TOKENS.TRAINING_EXERCISE_REPOSITORY,
    SKILL_TOKENS.SKILL_DOMAIN_SERVICE,
  ],
})
export class SkillModule {}
