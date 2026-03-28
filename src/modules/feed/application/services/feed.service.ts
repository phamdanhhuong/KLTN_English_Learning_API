import { Injectable, Inject, Logger } from '@nestjs/common';
import { FEED_TOKENS } from '../../domain/di/tokens';
import type { FeedRepository } from '../../domain/repositories/feed.repository.interface';

export type FeedPostType =
  | 'STREAK_MILESTONE'
  | 'LEAGUE_PROMOTION'
  | 'LEAGUE_TOP_3'
  | 'NEW_FOLLOWER'
  | 'ACHIEVEMENT_UNLOCKED'
  | 'LEVEL_UP'
  | 'QUEST_COMPLETED'
  | 'PERFECT_SCORE'
  | 'XP_MILESTONE';

@Injectable()
export class FeedService {
  private readonly logger = new Logger(FeedService.name);

  constructor(
    @Inject(FEED_TOKENS.FEED_REPOSITORY)
    private readonly feedRepo: FeedRepository,
  ) {}

  // ─── Content generator ───

  generatePostContent(postType: FeedPostType, metadata: Record<string, any>): string {
    switch (postType) {
      case 'STREAK_MILESTONE':
        return `Đã duy trì streak ${metadata.streakDays} ngày! 🔥`;
      case 'LEAGUE_PROMOTION':
        return `Thăng hạng lên ${metadata.newTier}! 🏆`;
      case 'LEAGUE_TOP_3':
        return `Đã vào Top ${metadata.rank} trong giải đấu ${metadata.tier}! 🥇`;
      case 'NEW_FOLLOWER':
        if (metadata.followerCount && metadata.followerCount >= 10) {
          return `Đã có ${metadata.followerCount} người theo dõi! 👥`;
        }
        return `${metadata.followerName} đã theo dõi bạn! 👋`;
      case 'ACHIEVEMENT_UNLOCKED':
        return `Đã mở khóa thành tích: ${metadata.achievementName}! 🎖️`;
      case 'LEVEL_UP':
        return `Đã lên cấp ${metadata.newLevel}! ⬆️`;
      case 'QUEST_COMPLETED':
        return `Hoàn thành nhiệm vụ: ${metadata.questName}! ✅`;
      case 'PERFECT_SCORE':
        return `Đạt điểm tuyệt đối trong ${metadata.lessonName || 'bài học'}! 💯`;
      case 'XP_MILESTONE':
        return `Đã đạt ${metadata.totalXp} XP! ⭐`;
      default:
        return 'Đã đạt một thành tựu mới!';
    }
  }

  shouldCreatePost(postType: FeedPostType, metadata: Record<string, any>): boolean {
    switch (postType) {
      case 'STREAK_MILESTONE':
        return [7, 14, 30, 50, 100, 365].includes(metadata.streakDays);
      case 'LEAGUE_PROMOTION':
        return true;
      case 'LEAGUE_TOP_3':
        return metadata.rank <= 3;
      case 'NEW_FOLLOWER':
        if (metadata.followerName) return true;
        return metadata.followerCount && metadata.followerCount % 10 === 0;
      case 'ACHIEVEMENT_UNLOCKED':
        return (metadata.tier ?? 0) >= 3;
      case 'LEVEL_UP':
        return metadata.newLevel % 5 === 0;
      case 'QUEST_COMPLETED':
        return metadata.isSpecial === true;
      case 'PERFECT_SCORE':
        return false;
      case 'XP_MILESTONE':
        return [1000, 5000, 10000, 25000, 50000, 100000].includes(metadata.totalXp);
      default:
        return false;
    }
  }

  async autoCreatePost(
    userId: string,
    postType: FeedPostType,
    metadata: Record<string, any>,
  ): Promise<void> {
    if (!this.shouldCreatePost(postType, metadata)) return;

    // Deduplicate: check within 5 mins
    const threshold = new Date();
    threshold.setMinutes(threshold.getMinutes() - 5);
    const recent = await this.feedRepo.findRecentPost(userId, postType, threshold);
    if (recent) return;

    const content = this.generatePostContent(postType, metadata);
    await this.feedRepo.createPost({
      userId,
      postType,
      content,
      metadata,
      imageUrl: metadata.imageUrl ?? null,
    });

    await this.feedRepo.invalidateFeedCachesForFollowers(userId);
    this.logger.log(`Auto-created feed post [${postType}] for user ${userId}`);
  }

  async getFeed(userId: string, limit = 20, offset = 0) {
    const cacheKey = `feed:${userId}:${offset}:${limit}`;
    const cached = await this.feedRepo.getCached(cacheKey);
    if (cached) return JSON.parse(cached);

    const followingIds = await this.feedRepo.getFollowingIds(userId);
    const userIds = [userId, ...followingIds];

    const result = await this.feedRepo.getFeedPosts(userIds, userId, limit, offset);
    await this.feedRepo.setCache(cacheKey, JSON.stringify(result), 120);
    return result;
  }

  async getUserPosts(userId: string, limit = 20, offset = 0) {
    return this.feedRepo.getUserPosts(userId, limit, offset);
  }

  async deletePost(postId: string, userId: string): Promise<void> {
    const post = await this.feedRepo.findPostById(postId);
    if (!post) throw new Error('Post not found');
    if (post.userId !== userId) throw new Error('Not authorized to delete this post');
    await this.feedRepo.deletePost(postId);
    await this.feedRepo.invalidateFeedCachesForFollowers(userId);
  }

  async toggleReaction(postId: string, userId: string, reactionType: string): Promise<'added' | 'removed' | 'changed'> {
    const existing = await this.feedRepo.findReaction(postId, userId);

    if (!existing) {
      await this.feedRepo.createReaction(postId, userId, reactionType);
      await this.feedRepo.invalidateCache(`feed:reactions:${postId}`);
      return 'added';
    }

    if (existing.reactionType === reactionType) {
      await this.feedRepo.deleteReaction(postId, userId);
      await this.feedRepo.invalidateCache(`feed:reactions:${postId}`);
      return 'removed';
    }

    await this.feedRepo.updateReaction(postId, userId, reactionType);
    await this.feedRepo.invalidateCache(`feed:reactions:${postId}`);
    return 'changed';
  }

  async getPostReactions(postId: string, filterType?: string) {
    const cacheKey = `feed:reactions:${postId}`;
    const cached = await this.feedRepo.getCached(cacheKey);
    let reactions;

    if (cached) {
      reactions = JSON.parse(cached);
    } else {
      reactions = await this.feedRepo.getPostReactions(postId);
      await this.feedRepo.setCache(cacheKey, JSON.stringify(reactions), 60);
    }

    if (filterType) {
      return reactions.filter((r: any) => r.reactionType === filterType);
    }
    return reactions;
  }

  async addComment(postId: string, userId: string, content: string) {
    return this.feedRepo.createComment(postId, userId, content);
  }

  async getPostComments(postId: string, limit = 20, offset = 0) {
    return this.feedRepo.getPostComments(postId, limit, offset);
  }

  async updateComment(commentId: string, userId: string, content: string) {
    const comment = await this.feedRepo.findCommentById(commentId);
    if (!comment) throw new Error('Comment not found');
    if (comment.userId !== userId) throw new Error('Not authorized to update this comment');
    return this.feedRepo.updateComment(commentId, content);
  }

  async deleteComment(commentId: string, userId: string): Promise<void> {
    const comment = await this.feedRepo.findCommentById(commentId);
    if (!comment) throw new Error('Comment not found');
    if (comment.userId !== userId) throw new Error('Not authorized to delete this comment');
    await this.feedRepo.deleteComment(commentId);
  }
}
