import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './infrastructure/database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { SkillModule } from './modules/skill/skill.module';
import { ProgressModule } from './modules/progress/progress.module';
import { MailModule } from './common/mail/mail.module';
import { UserModule } from './modules/user/user.module';
import { GamificationModule } from './modules/gamification/gamification.module';
import { SocialModule } from './modules/social/social.module';
import { AchievementModule } from './modules/achievement/achievement.module';
import { QuestModule } from './modules/quest/quest.module';
import { LeaderboardModule } from './modules/leaderboard/leaderboard.module';
import { FeedModule } from './modules/feed/feed.module';
import { SpeechModule } from './modules/speech/speech.module';
import { ScoringModule } from './modules/scoring/scoring.module';
import { ChatModule } from './modules/chat/chat.module';
import { VoiceModule } from './modules/voice/voice.module';
import { EventEmitterModule } from '@nestjs/event-emitter/dist/event-emitter.module';

@Module({
  imports: [
    // Global config - loads .env
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    //Emitter
    EventEmitterModule.forRoot(),

    // Database
    PrismaModule,

    // Common / Shared
    MailModule,

    // Feature modules
    UserModule,
    AuthModule,
    GamificationModule,
    SocialModule,
    AchievementModule,
    QuestModule,
    LeaderboardModule,
    FeedModule,
    SkillModule,
    ProgressModule,
    SpeechModule,
    ScoringModule,
    ChatModule,
    VoiceModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
