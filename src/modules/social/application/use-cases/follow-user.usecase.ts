import {
  Injectable,
  Inject,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { SOCIAL_TOKENS } from '../../domain/di/tokens';
import type { SocialRepository } from '../../domain/repositories/social.repository.interface';
import { FeedService } from '../../../feed/application/services/feed.service';
import { AchievementCheckerService } from '../../../achievement/application/services/achievement-checker.service';

@Injectable()
export class FollowUserUseCase {
  constructor(
    @Inject(SOCIAL_TOKENS.SOCIAL_REPOSITORY)
    private readonly socialRepo: SocialRepository,
    private readonly feedService: FeedService,
    private readonly achievementChecker: AchievementCheckerService,
  ) {}

  async execute(currentUserId: string, targetUserId: string) {
    if (currentUserId === targetUserId) {
      throw new BadRequestException('Cannot follow yourself');
    }

    // Check if target user exists
    const exists = await (this.socialRepo as any).userExists(targetUserId);
    if (!exists) {
      throw new BadRequestException('User not found');
    }

    // Check if blocked
    const blocked = await this.socialRepo.isBlocked(
      currentUserId,
      targetUserId,
    );
    if (blocked) {
      throw new BadRequestException('Cannot follow this user');
    }

    // Check if already following
    const alreadyFollowing = await this.socialRepo.isFollowing(
      currentUserId,
      targetUserId,
    );
    if (alreadyFollowing) {
      throw new ConflictException('Already following this user');
    }

    await this.socialRepo.follow(currentUserId, targetUserId);

    // Feed auto-create: NEW_FOLLOWER post
    const currentUser = await this.socialRepo.getUserBasicInfo(currentUserId);
    this.feedService
      .autoCreatePost(targetUserId, 'NEW_FOLLOWER', {
        followerName:
          currentUser?.fullName || currentUser?.username || 'Someone',
        followerId: currentUserId,
      })
      .catch(() => {}); // fire-and-forget

    // Update achievement for following count
    this.socialRepo
      .getFollowing(currentUserId)
      .then((res) => {
        this.achievementChecker
          .check(currentUserId, 'following_count', res.length)
          .catch(() => {});
      })
      .catch(() => {});

    return { followed: true, targetUserId };
  }
}
