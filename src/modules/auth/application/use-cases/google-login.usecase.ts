import {
  Inject,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AUTH_TOKENS } from '../../domain/di/tokens';
import { AuthUserRepository } from '../../domain/repositories/auth-user.repository';
import { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository';
import { TokenService, TokenPair } from '../../domain/services/token.service';
import { UserProfileService } from '../../domain/services/user-profile.service';
import { LearningService } from '../../domain/services/learning.service';

interface GooglePayload {
  sub: string;
  email: string;
  name: string;
  picture: string;
  email_verified: boolean;
}

@Injectable()
export class GoogleLoginUseCase {
  private readonly logger = new Logger(GoogleLoginUseCase.name);

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
    private readonly configService: ConfigService,
  ) {}

  async execute(
    idToken: string,
  ): Promise<{
    tokens: TokenPair;
    user: { id: string; email: string; role: { id: number; name: string } };
    isNewUser: boolean;
  }> {
    // Verify Google ID token
    const googlePayload = await this.verifyGoogleToken(idToken);

    // Try to find existing user by Google ID
    let user = await this.authUserRepo.findByGoogleId(googlePayload.sub);
    let isNewUser = false;

    if (!user) {
      // Check if email exists (user registered with email, now linking Google)
      user = await this.authUserRepo.findByEmail(googlePayload.email);

      if (user) {
        // Link Google account to existing user
        user = await this.authUserRepo.update(user.id, {
          googleId: googlePayload.sub,
          isEmailVerified: true,
        });
      } else {
        // Create new user
        isNewUser = true;
        user = await this.authUserRepo.create({
          email: googlePayload.email,
          googleId: googlePayload.sub,
          roleId: 'USER',
          isEmailVerified: true,
        });

        // Create profile in UserModule (includes all gamification + league + achievements)
        try {
          await this.userProfileService.createUserProfileWithDetails(
            user.id,
            googlePayload.email,
            googlePayload.name,
            googlePayload.picture,
          );
        } catch (error) {
          this.logger.warn(
            `Failed to create user profile for Google user ${user.id}: ${error.message}`,
          );
        }
      }
    }

    // Update last login
    await this.authUserRepo.update(user.id, { lastLoginAt: new Date() });

    const roleName = user.role?.name || 'USER';
    const payload = { sub: user.id, email: user.email, role: roleName };

    const tokens: TokenPair = {
      accessToken: this.tokenService.generateAccessToken(payload),
      refreshToken: this.tokenService.generateRefreshToken(payload),
    };

    await this.refreshTokenRepo.create({
      token: tokens.refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return {
      tokens,
      user: { id: user.id, email: user.email, role: { id: 1, name: roleName } },
      isNewUser,
    };
  }

  private async verifyGoogleToken(idToken: string): Promise<GooglePayload> {
    try {
      const { OAuth2Client } = await import('google-auth-library');
      const client = new OAuth2Client(
        this.configService.get<string>('GOOGLE_CLIENT_ID'),
      );

      const ticket = await client.verifyIdToken({
        idToken,
        audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new UnauthorizedException('Invalid Google token payload');
      }

      return {
        sub: payload.sub,
        email: payload.email!,
        name: payload.name || '',
        picture: payload.picture || '',
        email_verified: payload.email_verified || false,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Failed to verify Google token');
    }
  }
}
