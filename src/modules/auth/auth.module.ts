import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';

// Domain - DI Tokens
import { AUTH_TOKENS } from './domain/di/tokens';

// Application - Use Cases
import { RegisterUserUseCase } from './application/use-cases/register-user.usecase';
import { VerifyRegistrationUseCase } from './application/use-cases/verify-registration.usecase';
import { LoginUserUseCase } from './application/use-cases/login-user.usecase';
import { LogoutUserUseCase } from './application/use-cases/logout-user.usecase';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.usecase';
import { ChangePasswordUseCase } from './application/use-cases/change-password.usecase';
import { ForgotPasswordUseCase } from './application/use-cases/forgot-password.usecase';
import { GoogleLoginUseCase } from './application/use-cases/google-login.usecase';
import { FacebookLoginUseCase } from './application/use-cases/facebook-login.usecase';

// Infrastructure - Repository Implementations
import { PrismaAuthUserRepository } from './infrastructure/persistence/prisma-auth-user.repository';
import { PrismaRefreshTokenRepository } from './infrastructure/persistence/prisma-refresh-token.repository';

// Infrastructure - Service Implementations
import { BcryptHashService } from './infrastructure/services/bcrypt-hash.service';
import { JwtTokenService } from './infrastructure/services/jwt-token.service';
import { CacheServiceImpl } from './infrastructure/services/cache.service.impl';
import { UserProfileServiceStub } from './infrastructure/services/user-profile.service.stub';
import { LearningServiceStub } from './infrastructure/services/learning.service.stub';

// Presentation - Controllers
import { AuthController } from './presentation/controllers/auth.controller';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION', '1h') as any,
        },
      }),
    }),
    CacheModule.register(),
  ],
  controllers: [AuthController],
  providers: [
    // Use Cases
    RegisterUserUseCase,
    VerifyRegistrationUseCase,
    LoginUserUseCase,
    LogoutUserUseCase,
    RefreshTokenUseCase,
    ChangePasswordUseCase,
    ForgotPasswordUseCase,
    GoogleLoginUseCase,
    FacebookLoginUseCase,

    // Repository Bindings (Interface → Implementation)
    {
      provide: AUTH_TOKENS.AUTH_USER_REPOSITORY,
      useClass: PrismaAuthUserRepository,
    },
    {
      provide: AUTH_TOKENS.REFRESH_TOKEN_REPOSITORY,
      useClass: PrismaRefreshTokenRepository,
    },

    // Service Bindings (Interface → Implementation)
    {
      provide: AUTH_TOKENS.HASH_SERVICE,
      useClass: BcryptHashService,
    },
    {
      provide: AUTH_TOKENS.TOKEN_SERVICE,
      useClass: JwtTokenService,
    },
    {
      provide: AUTH_TOKENS.CACHE_SERVICE,
      useClass: CacheServiceImpl,
    },

    // Cross-module Service Bindings (STUBS - Phase 1)
    // TODO: Replace stubs with real implementations when UserModule/LearningModule are ready
    {
      provide: AUTH_TOKENS.USER_PROFILE_SERVICE,
      useClass: UserProfileServiceStub,
    },
    {
      provide: AUTH_TOKENS.LEARNING_SERVICE,
      useClass: LearningServiceStub,
    },
  ],
  exports: [
    // Export for other modules that need auth functionality
    AUTH_TOKENS.TOKEN_SERVICE,
    AUTH_TOKENS.AUTH_USER_REPOSITORY,
    JwtModule,
  ],
})
export class AuthModule {}
