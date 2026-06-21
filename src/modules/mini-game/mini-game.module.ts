import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { MiniGameController } from './presentation/controllers/mini-game.controller';
import { GenerateMiniGameUseCase } from './application/use-cases/generate-mini-game.usecase';
import { SubmitMiniGameScoreUseCase } from './application/use-cases/submit-mini-game.usecase';
import { PrismaUserMiniGameRepository } from './infrastructure/repositories/prisma-user-mini-game.repository';
import { SkillModule } from '../skill/skill.module';
import { GamificationModule } from '../gamification/gamification.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, SkillModule, AuthModule],
  controllers: [MiniGameController],
  providers: [
    GenerateMiniGameUseCase,
    SubmitMiniGameScoreUseCase,
    {
      provide: 'UserMiniGameRepository',
      useClass: PrismaUserMiniGameRepository,
    },
  ],
  exports: [],
})
export class MiniGameModule {}
