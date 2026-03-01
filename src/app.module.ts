import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './infrastructure/database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { SkillModule } from './modules/skill/skill.module';

@Module({
  imports: [
    // Global config - loads .env
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    PrismaModule,

    // Feature modules
    AuthModule,
    SkillModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
