import { Injectable, Inject } from '@nestjs/common';
import { SOCIAL_TOKENS } from '../../domain/di/tokens';
import type { SocialRepository } from '../../domain/repositories/social.repository.interface';

@Injectable()
export class GetFollowingUseCase {
  constructor(
    @Inject(SOCIAL_TOKENS.SOCIAL_REPOSITORY)
    private readonly socialRepo: SocialRepository,
  ) {}

  async execute(userId: string, _limit = 50, _offset = 0) {
    return this.socialRepo.getFollowing(userId);
  }
}

@Injectable()
export class GetFollowersUseCase {
  constructor(
    @Inject(SOCIAL_TOKENS.SOCIAL_REPOSITORY)
    private readonly socialRepo: SocialRepository,
  ) {}

  async execute(userId: string, _limit = 50, _offset = 0) {
    return this.socialRepo.getFollowers(userId);
  }
}
