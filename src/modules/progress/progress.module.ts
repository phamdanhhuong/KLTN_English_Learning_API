import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GamificationModule } from '../gamification/gamification.module';

// Domain - DI Tokens
import { PROGRESS_TOKENS } from './domain/di/tokens';

// Application - Use Cases
import { GetSkillProgressByUserIdUseCase, SubmitLessonResultUseCase } from './application/use-cases';

// Infrastructure - Repositories
import { PrismaSkillProgressRepository } from './infrastructure/repositories/prisma-skill-progress.repository';

// Infrastructure - Services
import { LessonSubmissionService } from './infrastructure/services/lesson-submission.service';
import { MasteryUpdateService } from './infrastructure/services/mastery-update.service';
import { SkillProgressService } from './infrastructure/services/skill-progress.service';

// Presentation - Controllers
import { ProgressController } from './presentation/controllers/progress.controller';

@Module({
  imports: [AuthModule, GamificationModule],
  controllers: [ProgressController],
  providers: [
    // Repository
    {
      provide: PROGRESS_TOKENS.SKILL_PROGRESS_REPOSITORY,
      useClass: PrismaSkillProgressRepository,
    },

    // Service Bindings (Interface → Implementation)
    {
      provide: PROGRESS_TOKENS.LESSON_SUBMISSION_SERVICE,
      useClass: LessonSubmissionService,
    },
    {
      provide: PROGRESS_TOKENS.MASTERY_UPDATE_SERVICE,
      useClass: MasteryUpdateService,
    },
    {
      provide: PROGRESS_TOKENS.SKILL_PROGRESS_SERVICE,
      useClass: SkillProgressService,
    },

    // Use Cases
    GetSkillProgressByUserIdUseCase,
    SubmitLessonResultUseCase,
  ],
  exports: [
    GetSkillProgressByUserIdUseCase,
    SubmitLessonResultUseCase,
    PROGRESS_TOKENS.SKILL_PROGRESS_REPOSITORY,
  ],
})
export class ProgressModule {}
