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
import { CacheService } from '../../domain/services/cache.service';
import { CompleteRegistrationDto } from '../dto/complete-registration.dto';

interface CachedRegistrationData {
  hashedPassword: string;
  fullName?: string;
  profilePictureUrl?: string;
  dateOfBirth?: string;
  gender?: string;
  nativeLanguage?: string;
  targetLanguage?: string;
  proficiencyLevel?: string;
  learningGoals?: string[];
  dailyGoalMinutes?: number;
  timezone?: string;
  studyReminder?: string;
  reminderTime?: string;
}

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
    @Inject(AUTH_TOKENS.CACHE_SERVICE)
    private readonly cacheService: CacheService,
  ) {}

  async execute(
    dto: CompleteRegistrationDto,
  ): Promise<{ tokens: TokenPair; message: string }> {
    // Mobile sends email as "userId" and otp code as "otp"
    const email = dto.userId;
    const otpCode = dto.otp;

    // Verify OTP
    const isValid = await this.userProfileService.verifyRegistrationOtp(
      email,
      otpCode,
    );
    if (!isValid) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Retrieve cached registration data (saved during register/initiate step)
    const cachedRaw = await this.cacheService.get<string>(
      `register:${email}`,
    );
    if (!cachedRaw) {
      throw new BadRequestException(
        'Registration session expired. Please register again.',
      );
    }

    const registrationData: CachedRegistrationData =
      typeof cachedRaw === 'string' ? JSON.parse(cachedRaw) : cachedRaw;

    // Check if user already exists (race condition protection)
    const existingUser = await this.authUserRepo.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    // Get default USER role ID
    const defaultRoleId = await this.getDefaultRoleId();

    // Create user with full onboarding data
    const user = await this.authUserRepo.create({
      email,
      password: registrationData.hashedPassword,
      roleId: defaultRoleId,
      isEmailVerified: true,
      fullName: registrationData.fullName,
      profilePictureUrl: registrationData.profilePictureUrl,
      dateOfBirth: registrationData.dateOfBirth
        ? new Date(registrationData.dateOfBirth)
        : undefined,
      gender: registrationData.gender,
      nativeLanguage: registrationData.nativeLanguage,
      targetLanguage: registrationData.targetLanguage,
      proficiencyLevel: registrationData.proficiencyLevel,
      learningGoals: registrationData.learningGoals,
      dailyGoalMinutes: registrationData.dailyGoalMinutes,
      timezone: registrationData.timezone,
    });

    // Clean up cached registration data
    await this.cacheService.del(`register:${email}`);

    // Initialize all user profiles (gamification + league + achievements)
    try {
      await this.userProfileService.createUserProfile(user.id, user.email);
    } catch (error) {
      this.logger.warn(
        `Failed to create user profile for ${user.id}: ${error.message}`,
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
    const cached = await this.cacheService.get<string>('role:USER');
    if (cached) return cached;
    return 'USER';
  }
}
