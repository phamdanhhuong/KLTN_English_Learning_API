export interface FeedRepository {
  // Post operations
  findRecentPost(userId: string, postType: string, thresholdDate: Date): Promise<any | null>;
  createPost(data: {
    userId: string;
    postType: string;
    content: string;
    metadata: Record<string, any>;
    imageUrl?: string | null;
  }): Promise<any>;
  deletePost(postId: string): Promise<void>;
  findPostById(postId: string): Promise<any | null>;

  // Feed queries
  getFeedPosts(userIds: string[], currentUserId: string, limit: number, offset: number): Promise<any[]>;
  getUserPosts(userId: string, limit: number, offset: number): Promise<any[]>;
  getFollowingIds(userId: string): Promise<string[]>;
  getFollowerIds(userId: string): Promise<string[]>;

  // Reaction operations
  findReaction(postId: string, userId: string): Promise<any | null>;
  createReaction(postId: string, userId: string, reactionType: string): Promise<void>;
  deleteReaction(postId: string, userId: string): Promise<void>;
  updateReaction(postId: string, userId: string, reactionType: string): Promise<void>;
  getPostReactions(postId: string): Promise<any[]>;

  // Comment operations
  createComment(postId: string, userId: string, content: string): Promise<any>;
  getPostComments(postId: string, limit: number, offset: number): Promise<any[]>;
  findCommentById(commentId: string): Promise<any | null>;
  updateComment(commentId: string, content: string): Promise<any>;
  deleteComment(commentId: string): Promise<void>;

  // Cache
  getCached(key: string): Promise<string | null>;
  setCache(key: string, value: string, ttl: number): Promise<void>;
  invalidateCache(pattern: string): Promise<void>;
  invalidateFeedCachesForFollowers(userId: string): Promise<void>;
}
