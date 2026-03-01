import { Module } from '@nestjs/common';
import { RedisModule } from '../../infrastructure/cache/redis.module';

// Controllers
import { SkillController } from './presentation/controllers/skill.controller';
import { SkillPartController } from './presentation/controllers/skill-part.controller';
import { LessonController } from './presentation/controllers/lesson.controller';
import { ExerciseController } from './presentation/controllers/exercise.controller';

// Use Cases
import { SkillUseCases } from './application/usecases/skill.usecases';
import { SkillPartUseCases } from './application/usecases/skill-part.usecases';
import { LessonUseCases } from './application/usecases/lesson.usecases';
import { ExerciseUseCases } from './application/usecases/exercise.usecases';

// Application Services
import { ExerciseMetaValidatorService } from './application/services/exercise-meta-validator.service';

// Infrastructure - Repositories
import { PrismaSkillRepository } from './infrastructure/repositories/prisma-skill.repository';
import { PrismaSkillLevelRepository } from './infrastructure/repositories/prisma-skill-level.repository';
import { PrismaSkillPartRepository } from './infrastructure/repositories/prisma-skill-part.repository';
import { PrismaLessonRepository } from './infrastructure/repositories/prisma-lesson.repository';
import { PrismaExerciseRepository } from './infrastructure/repositories/prisma-exercise.repository';

// Infrastructure - Domain Service
import { SkillDomainServiceImpl } from './infrastructure/services/skill-domain.service';

// DI Tokens
import { SKILL_TOKENS } from './domain/di/tokens';

@Module({
  imports: [RedisModule],
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

    // Domain Service
    {
      provide: SKILL_TOKENS.SKILL_DOMAIN_SERVICE,
      useClass: SkillDomainServiceImpl,
    },

    // Use Cases
    SkillUseCases,
    SkillPartUseCases,
    LessonUseCases,
    ExerciseUseCases,

    // Application Services
    ExerciseMetaValidatorService,
  ],
  exports: [
    SkillUseCases,
    SkillPartUseCases,
    LessonUseCases,
    ExerciseUseCases,
    SKILL_TOKENS.SKILL_REPOSITORY,
    SKILL_TOKENS.SKILL_PART_REPOSITORY,
    SKILL_TOKENS.LESSON_REPOSITORY,
    SKILL_TOKENS.EXERCISE_REPOSITORY,
    SKILL_TOKENS.SKILL_DOMAIN_SERVICE,
  ],
})
export class SkillModule {}
