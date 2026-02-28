import {
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AUTH_TOKENS } from '../../domain/di/tokens';
import { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository';
import { TokenService, TokenPair } from '../../domain/services/token.service';
import { AuthUserRepository } from '../../domain/repositories/auth-user.repository';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(AUTH_TOKENS.REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepo: RefreshTokenRepository,
    @Inject(AUTH_TOKENS.TOKEN_SERVICE)
    private readonly tokenService: TokenService,
    @Inject(AUTH_TOKENS.AUTH_USER_REPOSITORY)
    private readonly authUserRepo: AuthUserRepository,
  ) {}

  async execute(refreshToken: string): Promise<TokenPair> {
    // Verify refresh token signature
    let payload;
    try {
      payload = this.tokenService.verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if token exists and is not revoked
    const storedToken = await this.refreshTokenRepo.findByToken(refreshToken);
    if (!storedToken || storedToken.isRevoked) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (new Date() > storedToken.expiresAt) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    // Verify user still exists and is active
    const user = await this.authUserRepo.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or deactivated');
    }

    // Revoke old refresh token (rotation)
    await this.refreshTokenRepo.revokeByToken(refreshToken);

    // Generate new token pair
    const roleName = user.role?.name || 'USER';
    const newPayload = { sub: user.id, email: user.email, role: roleName };

    const newTokens: TokenPair = {
      accessToken: this.tokenService.generateAccessToken(newPayload),
      refreshToken: this.tokenService.generateRefreshToken(newPayload),
    };

    // Save new refresh token
    await this.refreshTokenRepo.create({
      token: newTokens.refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return newTokens;
  }
}
