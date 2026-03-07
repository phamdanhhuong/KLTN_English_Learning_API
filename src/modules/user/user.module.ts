import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { USER_TOKENS } from './domain/di/tokens';

// Application - Use Cases
import { GetProfileUseCase } from './application/use-cases/get-profile.usecase';
import { UpdateProfileUseCase } from './application/use-cases/update-profile.usecase';
import { UpdatePreferencesUseCase } from './application/use-cases/update-preferences.usecase';
import { GetUserStatsUseCase } from './application/use-cases/get-stats.usecase';
import { GetXpHistoryUseCase } from './application/use-cases/get-xp-history.usecase';
import { GetPublicProfileUseCase, SearchUsersUseCase } from './application/use-cases/get-public-profile.usecase';

// Infrastructure
import { PrismaUserProfileRepository } from './infrastructure/persistence/prisma-user-profile.repository';
import { UserProfileServiceImpl } from './infrastructure/services/user-profile.service.impl';
import { CacheServiceImpl } from '../auth/infrastructure/services/cache.service.impl';

// Presentation
import { UserController } from './presentation/user.controller';

@Module({
  imports: [
    PrismaModule,
    CacheModule.register(),
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
  controllers: [UserController],
  providers: [
    { provide: USER_TOKENS.USER_PROFILE_REPOSITORY, useClass: PrismaUserProfileRepository },
    PrismaUserProfileRepository,
    CacheServiceImpl,
    UserProfileServiceImpl,

    // Use Cases
    GetProfileUseCase,
    UpdateProfileUseCase,
    UpdatePreferencesUseCase,
    GetUserStatsUseCase,
    GetXpHistoryUseCase,
    GetPublicProfileUseCase,
    SearchUsersUseCase,
  ],
  exports: [
    UserProfileServiceImpl,
    USER_TOKENS.USER_PROFILE_REPOSITORY,
  ],
})
export class UserModule {}
