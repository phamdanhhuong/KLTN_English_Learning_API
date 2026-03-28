import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { RedisService } from '../../../../infrastructure/cache/redis.service';
import type { FeedRepository } from '../../domain/repositories/feed.repository.interface';

const USER_SELECT = {
  id: true, username: true, fullName: true,
  profilePictureUrl: true, currentLevel: true,
};

@Injectable()
export class PrismaFeedRepository implements FeedRepository {
  private readonly logger = new Logger(PrismaFeedRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  // ─── Post operations ───

  async findRecentPost(userId: string, postType: string, thresholdDate: Date) {
    return this.prisma.feedPost.findFirst({
      where: { userId, postType: postType as any, createdAt: { gte: thresholdDate } },
    });
  }

  async createPost(data: {
    userId: string;
    postType: string;
    content: string;
    metadata: Record<string, any>;
    imageUrl?: string | null;
  }) {
    return this.prisma.feedPost.create({
      data: {
        userId: data.userId,
        postType: data.postType as any,
        content: data.content,
        metadata: data.metadata,
        imageUrl: data.imageUrl ?? null,
        isVisible: true,
      },
    });
  }

  async deletePost(postId: string) {
    await this.prisma.feedPost.delete({ where: { id: postId } });
  }

  async findPostById(postId: string) {
    return this.prisma.feedPost.findUnique({ where: { id: postId } });
  }

  // ─── Feed queries ───

  async getFeedPosts(userIds: string[], currentUserId: string, limit: number, offset: number) {
    const posts = await this.prisma.feedPost.findMany({
      where: { userId: { in: userIds }, isVisible: true },
      include: {
        user: { select: USER_SELECT },
        reactions: { select: { reactionType: true } },
        comments: {
          include: { user: { select: USER_SELECT } },
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
      where: { postId: { in: postIds }, userId: currentUserId },
      select: { postId: true, reactionType: true },
    });
    const userReactionMap = new Map(userReactions.map((r) => [r.postId, r.reactionType]));

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
      commentCount: (post as any)._count.comments,
      userReaction: userReactionMap.get(post.id) ?? null,
      latestComment: post.comments[0] ? this.mapComment(post.comments[0]) : null,
    }));
  }

  async getUserPosts(userId: string, limit: number, offset: number) {
    const posts = await this.prisma.feedPost.findMany({
      where: { userId, isVisible: true },
      include: {
        user: { select: USER_SELECT },
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
      commentCount: (post as any)._count.comments,
      userReaction: null,
      latestComment: null,
    }));
  }

  async getFollowingIds(userId: string) {
    const relations = await this.prisma.userRelationship.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    return relations.map((r) => r.followingId);
  }

  async getFollowerIds(userId: string) {
    const relations = await this.prisma.userRelationship.findMany({
      where: { followingId: userId },
      select: { followerId: true },
    });
    return relations.map((r) => r.followerId);
  }

  // ─── Reaction operations ───

  async findReaction(postId: string, userId: string) {
    return this.prisma.feedReaction.findUnique({
      where: { postId_userId: { postId, userId } },
    });
  }

  async createReaction(postId: string, userId: string, reactionType: string) {
    await this.prisma.feedReaction.create({
      data: { postId, userId, reactionType: reactionType as any },
    });
  }

  async deleteReaction(postId: string, userId: string) {
    await this.prisma.feedReaction.delete({
      where: { postId_userId: { postId, userId } },
    });
  }

  async updateReaction(postId: string, userId: string, reactionType: string) {
    await this.prisma.feedReaction.update({
      where: { postId_userId: { postId, userId } },
      data: { reactionType: reactionType as any },
    });
  }

  async getPostReactions(postId: string) {
    return this.prisma.feedReaction.findMany({
      where: { postId },
      include: { user: { select: USER_SELECT } },
    });
  }

  // ─── Comment operations ───

  async createComment(postId: string, userId: string, content: string) {
    const comment = await this.prisma.feedComment.create({
      data: { postId, userId, content },
      include: { user: { select: USER_SELECT } },
    });
    return this.mapComment(comment);
  }

  async getPostComments(postId: string, limit: number, offset: number) {
    const comments = await this.prisma.feedComment.findMany({
      where: { postId },
      include: { user: { select: USER_SELECT } },
      orderBy: { createdAt: 'asc' },
      take: limit,
      skip: offset,
    });
    return comments.map((c) => this.mapComment(c));
  }

  async findCommentById(commentId: string) {
    return this.prisma.feedComment.findUnique({ where: { id: commentId } });
  }

  async updateComment(commentId: string, content: string) {
    const updated = await this.prisma.feedComment.update({
      where: { id: commentId },
      data: { content, isEdited: true },
      include: { user: { select: USER_SELECT } },
    });
    return this.mapComment(updated);
  }

  async deleteComment(commentId: string) {
    await this.prisma.feedComment.delete({ where: { id: commentId } });
  }

  // ─── Cache ───

  async getCached(key: string) {
    return this.redis.get(key);
  }

  async setCache(key: string, value: string, ttl: number) {
    await this.redis.set(key, value, ttl);
  }

  async invalidateCache(key: string) {
    await this.redis.del(key);
  }

  async invalidateFeedCachesForFollowers(userId: string) {
    const keys = await this.redis.keys(`feed:${userId}:*`);
    for (const k of keys) await this.redis.del(k);

    const followers = await this.getFollowerIds(userId);
    for (const followerId of followers) {
      const followerKeys = await this.redis.keys(`feed:${followerId}:*`);
      for (const k of followerKeys) await this.redis.del(k);
    }
  }

  // ─── Private helpers ───

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
}
