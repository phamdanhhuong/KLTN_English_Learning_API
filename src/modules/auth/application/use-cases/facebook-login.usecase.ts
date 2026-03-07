import {
  Inject,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { AUTH_TOKENS } from '../../domain/di/tokens';
import { AuthUserRepository } from '../../domain/repositories/auth-user.repository';
import { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository';
import { TokenService, TokenPair } from '../../domain/services/token.service';
import { UserProfileService } from '../../domain/services/user-profile.service';
import { LearningService } from '../../domain/services/learning.service';

interface FacebookProfile {
  id: string;
  email: string;
  name: string;
  picture?: { data?: { url?: string } };
}

@Injectable()
export class FacebookLoginUseCase {
  private readonly logger = new Logger(FacebookLoginUseCase.name);

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
    accessToken: string,
  ): Promise<{
    tokens: TokenPair;
    user: { id: string; email: string; role: { id: number; name: string } };
    isNewUser: boolean;
  }> {
    const fbProfile = await this.verifyFacebookToken(accessToken);

    let user = await this.authUserRepo.findByFacebookId(fbProfile.id);
    let isNewUser = false;

    if (!user) {
      user = await this.authUserRepo.findByEmail(fbProfile.email);

      if (user) {
        user = await this.authUserRepo.update(user.id, {
          facebookId: fbProfile.id,
          isEmailVerified: true,
        });
      } else {
        isNewUser = true;
        user = await this.authUserRepo.create({
          email: fbProfile.email,
          facebookId: fbProfile.id,
          roleId: 'USER',
          isEmailVerified: true,
        });

        try {
          await this.userProfileService.createUserProfileWithDetails(
            user.id,
            fbProfile.email,
            fbProfile.name,
            fbProfile.picture?.data?.url,
          );
        } catch (error) {
          this.logger.warn(
            `Failed to create user profile for Facebook user ${user.id}: ${error.message}`,
          );
        }

        try {
          await this.learningService.initializeLearningProfile(user.id);
        } catch (error) {
          this.logger.warn(
            `Failed to initialize learning for Facebook user ${user.id}: ${error.message}`,
          );
        }
      }
    }

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

  private async verifyFacebookToken(
    accessToken: string,
  ): Promise<FacebookProfile> {
    try {
      const response = await axios.get(
        `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`,
      );

      if (!response.data.email) {
        throw new UnauthorizedException(
          'Facebook account does not have an email',
        );
      }

      return response.data;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Failed to verify Facebook token');
    }
  }
}
