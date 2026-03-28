import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { RedisModule } from '../../infrastructure/cache/redis.module';
import { FeedModule } from '../feed/feed.module';

// Domain
import { QUEST_TOKENS } from './domain/di/tokens';

// Application
import { QuestService } from './application/services/quest.service';
import { GetUserQuestsUseCase, GetCompletedQuestsUseCase } from './application/use-cases/get-quests.usecase';
import { ClaimQuestUseCase, GetUnlockedChestsUseCase, OpenChestUseCase } from './application/use-cases/claim-quest.usecase';
import {
  GetFriendsQuestParticipantsUseCase,
  JoinFriendsQuestUseCase,
  InviteFriendToQuestUseCase,
} from './application/use-cases/friends-quest.usecase';
import { QuestScheduler } from './application/schedulers/quest.scheduler';

// Infrastructure
import { PrismaQuestRepository } from './infrastructure/repositories/prisma-quest.repository';
import { PrismaUserQuestRepository } from './infrastructure/repositories/prisma-user-quest.repository';

// Presentation
import { QuestController } from './presentation/quest.controller';
import { UserQuestController } from './presentation/user-quest.controller';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    FeedModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRATION', '1h') as any },
      }),
    }),
  ],
  controllers: [QuestController, UserQuestController],
  providers: [
    // Repository bindings
    {
      provide: QUEST_TOKENS.QUEST_REPOSITORY,
      useClass: PrismaQuestRepository,
    },
    {
      provide: QUEST_TOKENS.USER_QUEST_REPOSITORY,
      useClass: PrismaUserQuestRepository,
    },
    // Services
    QuestService,
    QuestScheduler,
    // Use Cases
    GetUserQuestsUseCase,
    GetCompletedQuestsUseCase,
    ClaimQuestUseCase,
    GetUnlockedChestsUseCase,
    OpenChestUseCase,
    GetFriendsQuestParticipantsUseCase,
    JoinFriendsQuestUseCase,
    InviteFriendToQuestUseCase,
  ],
  exports: [QuestService],
})
export class QuestModule {}
