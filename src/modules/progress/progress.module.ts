import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';

// Domain - DI Tokens
import { PROGRESS_TOKENS } from './domain/di/tokens';

// Application - Use Cases
import { GetSkillProgressByUserIdUseCase } from './application/use-cases';

// Infrastructure - Repositories
import { PrismaSkillProgressRepository } from './infrastructure/repositories/prisma-skill-progress.repository';

// Presentation - Controllers
import { ProgressController } from './presentation/controllers/progress.controller';

@Module({
  imports: [AuthModule],
  controllers: [ProgressController],
  providers: [
    // Repository
    {
      provide: PROGRESS_TOKENS.SKILL_PROGRESS_REPOSITORY,
      useClass: PrismaSkillProgressRepository,
    },

    // Use Cases
    GetSkillProgressByUserIdUseCase,
  ],
  exports: [
    GetSkillProgressByUserIdUseCase,
    PROGRESS_TOKENS.SKILL_PROGRESS_REPOSITORY,
  ],
})
export class ProgressModule {}
