import {
  Inject,
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { AUTH_TOKENS } from '../../domain/di/tokens';
import { AuthUserRepository } from '../../domain/repositories/auth-user.repository';
import { TokenService, TokenPair } from '../../domain/services/token.service';
import { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository';
import { UserProfileService } from '../../domain/services/user-profile.service';
import { LearningService } from '../../domain/services/learning.service';
import { CacheService } from '../../domain/services/cache.service';
import { VerifyOtpDto } from '../dto/otp.dto';

@Injectable()
export class VerifyRegistrationUseCase {
  private readonly logger = new Logger(VerifyRegistrationUseCase.name);

  constructor(
    @Inject(AUTH_TOKENS.AUTH_USER_REPOSITORY)
    private readonly authUserRepo: AuthUserRepository,
    @Inject(AUTH_TOKENS.TOKEN_SERVICE)
    private readonly tokenService: TokenService,
    @Inject(AUTH_TOKENS.REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepo: RefreshTokenRepository,
    @Inject(AUTH_TOKENS.USER_PROFILE_SERVICE)
    private readonly userProfileService: UserProfileService,
    @Inject(AUTH_TOKENS.LEARNING_SERVICE)
    private readonly learningService: LearningService,
    @Inject(AUTH_TOKENS.CACHE_SERVICE)
    private readonly cacheService: CacheService,
  ) {}

  async execute(
    dto: VerifyOtpDto,
  ): Promise<{ tokens: TokenPair; message: string }> {
    // Verify OTP
    const isValid = await this.userProfileService.verifyRegistrationOtp(
      dto.email,
      dto.otpCode,
    );
    if (!isValid) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Retrieve hashed password from cache (saved during register step)
    const hashedPassword = await this.cacheService.get<string>(
      `register:${dto.email}`,
    );
    if (!hashedPassword) {
      throw new BadRequestException(
        'Registration session expired. Please register again.',
      );
    }

    // Check if user already exists (race condition protection)
    const existingUser = await this.authUserRepo.findByEmail(dto.email);
    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    // Get default USER role ID from cache or hardcode
    const defaultRoleId = await this.getDefaultRoleId();

    // Create auth user (password already hashed from register step)
    const user = await this.authUserRepo.create({
      email: dto.email,
      password: hashedPassword,
      roleId: defaultRoleId,
      isEmailVerified: true,
    });

    // Clean up cached password
    await this.cacheService.del(`register:${dto.email}`);

    // Create user profile in UserModule (cross-module call)
    try {
      await this.userProfileService.createUserProfile(user.id, user.email);
    } catch (error) {
      this.logger.warn(
        `Failed to create user profile for ${user.id}: ${error.message}`,
      );
    }

    // Initialize learning profile in LearningModule (cross-module call)
    try {
      await this.learningService.initializeLearningProfile(user.id);
    } catch (error) {
      this.logger.warn(
        `Failed to initialize learning profile for ${user.id}: ${error.message}`,
      );
    }

    // Generate tokens
    const roleName = user.role?.name || 'USER';
    const tokens = this.generateTokenPair(user.id, user.email, roleName);

    // Save refresh token
    await this.refreshTokenRepo.create({
      token: tokens.refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    return {
      tokens,
      message: 'Registration successful',
    };
  }

  private generateTokenPair(
    userId: string,
    email: string,
    role: string,
  ): TokenPair {
    const payload = { sub: userId, email, role };
    return {
      accessToken: this.tokenService.generateAccessToken(payload),
      refreshToken: this.tokenService.generateRefreshToken(payload),
    };
  }

  private async getDefaultRoleId(): Promise<string> {
    // Try cache first
    const cached = await this.cacheService.get<string>('role:USER');
    if (cached) return cached;

    // Fallback: This will be resolved when the role seed runs
    // For now, return a placeholder that gets resolved by the repository
    return 'USER';
  }
}
