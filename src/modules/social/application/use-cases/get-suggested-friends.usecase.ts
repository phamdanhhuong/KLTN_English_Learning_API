import { Injectable, Inject } from '@nestjs/common';
import { SOCIAL_TOKENS } from '../../domain/di/tokens';
import type { SocialRepository } from '../../domain/repositories/social.repository.interface';
import { RedisService } from '../../../../infrastructure/cache/redis.service';

export interface SuggestedUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  isFollowing: boolean;
  subtext?: string;
}

@Injectable()
export class GetSuggestedFriendsUseCase {
  private readonly CACHE_TTL = 1800; // 30 minutes

  constructor(
    @Inject(SOCIAL_TOKENS.SOCIAL_REPOSITORY)
    private readonly socialRepo: SocialRepository,
    private readonly redis: RedisService,
  ) {}

  async execute(currentUserId: string): Promise<SuggestedUser[]> {
    const cached = await this.redis.get(`social:suggest:${currentUserId}`);
    if (cached) return JSON.parse(cached);

    const followingIds = await this.socialRepo.getFollowingIds(currentUserId);
    const blockedIds = await this.socialRepo.getBlockedIds(currentUserId);
    const excludeIds = [...new Set([...followingIds, ...blockedIds, currentUserId])];

    let suggestions: SuggestedUser[] = [];

    // Strategy 1: Friends of friends
    if (followingIds.length > 0) {
      const fofUsers = await (this.socialRepo as any).getFriendsOfFriends(followingIds, excludeIds);
      suggestions = fofUsers.map((user: any) => ({
        id: user.id,
        username: user.username || '',
        displayName: user.fullName || user.username || 'User',
        avatarUrl: user.profilePictureUrl || '',
        isFollowing: false,
        subtext: 'Bạn có thể quen',
      }));
    }

    // Strategy 2: Fill with recent users
    if (suggestions.length < 10) {
      const allExclude = [...excludeIds, ...suggestions.map((s) => s.id)];
      const remaining = 10 - suggestions.length;
      const recentUsers = await this.socialRepo.getSuggestedUsers(allExclude, remaining);

      suggestions.push(
        ...recentUsers.map((user: any) => ({
          id: user.id,
          username: user.username || '',
          displayName: user.fullName || user.username || 'User',
          avatarUrl: user.profilePictureUrl || '',
          isFollowing: false,
          subtext: 'Gợi ý cho bạn',
        })),
      );
    }

    await this.redis.set(
      `social:suggest:${currentUserId}`,
      JSON.stringify(suggestions),
      this.CACHE_TTL,
    );

    return suggestions;
  }
}
