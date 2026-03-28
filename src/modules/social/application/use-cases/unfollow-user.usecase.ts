import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { SOCIAL_TOKENS } from '../../domain/di/tokens';
import type { SocialRepository } from '../../domain/repositories/social.repository.interface';

@Injectable()
export class UnfollowUserUseCase {
  constructor(
    @Inject(SOCIAL_TOKENS.SOCIAL_REPOSITORY)
    private readonly socialRepo: SocialRepository,
  ) {}

  async execute(currentUserId: string, targetUserId: string) {
    try {
      await this.socialRepo.unfollow(currentUserId, targetUserId);
    } catch (error: any) {
      if (error.message === 'NOT_FOLLOWING') {
        throw new BadRequestException('Not following this user');
      }
      throw error;
    }

    return { unfollowed: true, targetUserId };
  }
}
