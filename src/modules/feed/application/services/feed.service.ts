import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { RedisService } from '../../../../infrastructure/cache/redis.service';

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
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
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
    const recent = await this.prisma.feedPost.findFirst({
      where: { userId, postType, createdAt: { gte: threshold } },
    });
    if (recent) return;

    const content = this.generatePostContent(postType, metadata);
    await this.prisma.feedPost.create({
      data: {
        userId,
        postType,
        content,
        metadata,
        imageUrl: metadata.imageUrl ?? null,
        isVisible: true,
      },
    });

    // Invalidate feed cache for user's followers
    await this.invalidateFeedCachesForFollowers(userId);
    this.logger.log(`Auto-created feed post [${postType}] for user ${userId}`);
  }

  async getFeed(userId: string, limit = 20, offset = 0) {
    const cacheKey = `feed:${userId}:${offset}:${limit}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const following = await this.prisma.userRelationship.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const userIds = [userId, ...following.map((f) => f.followingId)];

    const posts = await this.prisma.feedPost.findMany({
      where: { userId: { in: userIds }, isVisible: true },
      include: {
        user: {
          select: {
            id: true, username: true, fullName: true,
            profilePictureUrl: true, currentLevel: true,
          },
        },
        reactions: { select: { reactionType: true } },
        comments: {
          include: {
            user: {
              select: {
                id: true, username: true, fullName: true, profilePictureUrl: true, currentLevel: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    // Batch fetch current user's reactions
    const postIds = posts.map((p) => p.id);
    const userReactions = await this.prisma.feedReaction.findMany({
      where: { postId: { in: postIds }, userId },
      select: { postId: true, reactionType: true },
    });
    const userReactionMap = new Map(userReactions.map((r) => [r.postId, r.reactionType]));

    const result = posts.map((post) => ({
      id: post.id,
      userId: post.userId,
      postType: post.postType,
      content: post.content,
      metadata: post.metadata,
      imageUrl: post.imageUrl,
      isVisible: post.isVisible,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      user: post.user,
      reactions: this.aggregateReactions(post.reactions),
      commentCount: post._count.comments,
      userReaction: userReactionMap.get(post.id) ?? null,
      latestComment: post.comments[0] ? this.mapComment(post.comments[0]) : null,
    }));

    await this.redis.set(cacheKey, JSON.stringify(result), 120); // 2 min cache
    return result;
  }

  async getUserPosts(userId: string, limit = 20, offset = 0) {
    const posts = await this.prisma.feedPost.findMany({
      where: { userId, isVisible: true },
      include: {
        user: {
          select: {
            id: true, username: true, fullName: true,
            profilePictureUrl: true, currentLevel: true,
          },
        },
        reactions: { select: { reactionType: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return posts.map((post) => ({
      id: post.id,
      userId: post.userId,
      postType: post.postType,
      content: post.content,
      metadata: post.metadata,
      imageUrl: post.imageUrl,
      isVisible: post.isVisible,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      user: post.user,
      reactions: this.aggregateReactions(post.reactions),
      commentCount: post._count.comments,
      userReaction: null,
      latestComment: null,
    }));
  }

  async deletePost(postId: string, userId: string): Promise<void> {
    const post = await this.prisma.feedPost.findUniqueOrThrow({ where: { id: postId } });
    if (post.userId !== userId) throw new Error('Not authorized to delete this post');
    await this.prisma.feedPost.delete({ where: { id: postId } });
    await this.invalidateFeedCachesForFollowers(userId);
  }

  async toggleReaction(postId: string, userId: string, reactionType: string): Promise<'added' | 'removed' | 'changed'> {
    const existing = await this.prisma.feedReaction.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    if (!existing) {
      await this.prisma.feedReaction.create({
        data: { postId, userId, reactionType: reactionType as any },
      });
      await this.redis.del(`feed:reactions:${postId}`);
      return 'added';
    }

    if (existing.reactionType === reactionType) {
      await this.prisma.feedReaction.delete({
        where: { postId_userId: { postId, userId } },
      });
      await this.redis.del(`feed:reactions:${postId}`);
      return 'removed';
    }

    await this.prisma.feedReaction.update({
      where: { postId_userId: { postId, userId } },
      data: { reactionType: reactionType as any },
    });
    await this.redis.del(`feed:reactions:${postId}`);
    return 'changed';
  }

  async getPostReactions(postId: string, filterType?: string) {
    const cacheKey = `feed:reactions:${postId}`;
    const cached = await this.redis.get(cacheKey);
    let reactions;

    if (cached) {
      reactions = JSON.parse(cached);
    } else {
      reactions = await this.prisma.feedReaction.findMany({
        where: { postId },
        include: {
          user: {
            select: { id: true, username: true, fullName: true, profilePictureUrl: true, currentLevel: true },
          },
        },
      });
      await this.redis.set(cacheKey, JSON.stringify(reactions), 60);
    }

    if (filterType) {
      return reactions.filter((r: any) => r.reactionType === filterType);
    }
    return reactions;
  }

  async addComment(postId: string, userId: string, content: string) {
    const comment = await this.prisma.feedComment.create({
      data: { postId, userId, content },
      include: {
        user: {
          select: { id: true, username: true, fullName: true, profilePictureUrl: true, currentLevel: true },
        },
      },
    });
    return this.mapComment(comment);
  }

  async getPostComments(postId: string, limit = 20, offset = 0) {
    const comments = await this.prisma.feedComment.findMany({
      where: { postId },
      include: {
        user: {
          select: { id: true, username: true, fullName: true, profilePictureUrl: true, currentLevel: true },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
      skip: offset,
    });
    return comments.map((c) => this.mapComment(c));
  }

  async updateComment(commentId: string, userId: string, content: string) {
    const comment = await this.prisma.feedComment.findUniqueOrThrow({ where: { id: commentId } });
    if (comment.userId !== userId) throw new Error('Not authorized to update this comment');

    const updated = await this.prisma.feedComment.update({
      where: { id: commentId },
      data: { content, isEdited: true },
      include: {
        user: {
          select: { id: true, username: true, fullName: true, profilePictureUrl: true, currentLevel: true },
        },
      },
    });
    return this.mapComment(updated);
  }

  async deleteComment(commentId: string, userId: string): Promise<void> {
    const comment = await this.prisma.feedComment.findUniqueOrThrow({ where: { id: commentId } });
    if (comment.userId !== userId) throw new Error('Not authorized to delete this comment');
    await this.prisma.feedComment.delete({ where: { id: commentId } });
  }

  // ─── Helpers ───

  private aggregateReactions(reactions: { reactionType: string }[]) {
    const map = new Map<string, number>();
    for (const r of reactions) {
      map.set(r.reactionType, (map.get(r.reactionType) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([reactionType, count]) => ({ reactionType, count }));
  }

  private mapComment(comment: any) {
    return {
      id: comment.id,
      postId: comment.postId,
      userId: comment.userId,
      content: comment.content,
      isEdited: comment.isEdited,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      user: comment.user,
    };
  }

  private async invalidateFeedCachesForFollowers(userId: string) {
    // Invalidate the user's own feed cache (various offsets)
    const keys = await this.redis.keys(`feed:${userId}:*`);
    for (const k of keys) await this.redis.del(k);

    // Invalidate followers' feed caches
    const followers = await this.prisma.userRelationship.findMany({
      where: { followingId: userId },
      select: { followerId: true },
    });
    for (const f of followers) {
      const followerKeys = await this.redis.keys(`feed:${f.followerId}:*`);
      for (const k of followerKeys) await this.redis.del(k);
    }
  }
}
