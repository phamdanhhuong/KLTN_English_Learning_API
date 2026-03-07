import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './infrastructure/database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { SkillModule } from './modules/skill/skill.module';
import { MailModule } from './common/mail/mail.module';
import { UserModule } from './modules/user/user.module';
import { GamificationModule } from './modules/gamification/gamification.module';

@Module({
  imports: [
    // Global config - loads .env
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    PrismaModule,

    // Common / Shared
    MailModule,

    // Feature modules
    UserModule,
    AuthModule,
    GamificationModule,
    SkillModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
