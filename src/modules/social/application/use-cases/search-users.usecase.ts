import { Injectable, Inject } from '@nestjs/common';
import { SOCIAL_TOKENS } from '../../domain/di/tokens';
import type { SocialRepository } from '../../domain/repositories/social.repository.interface';

@Injectable()
export class SearchUsersUseCase {
  constructor(
    @Inject(SOCIAL_TOKENS.SOCIAL_REPOSITORY)
    private readonly socialRepo: SocialRepository,
  ) {}

  async execute(currentUserId: string, query: string) {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const searchTerm = query.trim();

    const blockedIds = await this.socialRepo.getBlockedIds(currentUserId);
    const excludeIds = [...new Set([...blockedIds, currentUserId])];

    const users = await this.socialRepo.searchUsers(excludeIds, searchTerm);
    if (users.length === 0) return [];

    const followingSet = await this.socialRepo.getFollowingIdsFromList(
      currentUserId,
      users.map((u: any) => u.id),
    );

    return users.map((user: any) => ({
      id: user.id,
      username: user.username || '',
      displayName: user.fullName || user.username || 'User',
      avatarUrl: user.profilePictureUrl || '',
      isFollowing: followingSet.has(user.id),
    }));
  }
}
