import { Inject, Injectable } from '@nestjs/common';
import { AUTH_TOKENS } from '../../domain/di/tokens';
import { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository';
import { CacheService } from '../../domain/services/cache.service';

@Injectable()
export class LogoutUserUseCase {
  constructor(
    @Inject(AUTH_TOKENS.REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepo: RefreshTokenRepository,
    @Inject(AUTH_TOKENS.CACHE_SERVICE)
    private readonly cacheService: CacheService,
  ) {}

  async execute(
    userId: string,
    accessToken: string,
  ): Promise<{ message: string }> {
    // Revoke all refresh tokens for this user
    await this.refreshTokenRepo.revokeByUserId(userId);

    // Blacklist current access token in cache (until it expires)
    await this.cacheService.set(
      `blacklist:${accessToken}`,
      'revoked',
      3600, // 1 hour (should match access token TTL)
    );

    return { message: 'Logged out successfully' };
  }
}
