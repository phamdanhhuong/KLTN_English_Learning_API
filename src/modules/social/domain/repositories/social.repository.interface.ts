export interface SocialRepository {
  // Follow operations
  isFollowing(followerId: string, followingId: string): Promise<boolean>;
  isBlocked(userId1: string, userId2: string): Promise<boolean>;
  follow(followerId: string, followingId: string): Promise<void>;
  unfollow(followerId: string, followingId: string): Promise<void>;

  // Lists
  getFollowing(userId: string): Promise<any[]>;
  getFollowers(userId: string): Promise<any[]>;
  getFollowingIds(userId: string): Promise<string[]>;

  // Search & suggestions
  searchUsers(excludeIds: string[], searchTerm: string): Promise<any[]>;
  getSuggestedUsers(excludeIds: string[], limit?: number): Promise<any[]>;
  getBlockedIds(userId: string): Promise<string[]>;

  // Follow counts
  getFollowerCount(userId: string): Promise<number>;
  getUserBasicInfo(userId: string): Promise<{ username: string | null; fullName: string | null } | null>;

  // Batch check following
  getFollowingIdsFromList(currentUserId: string, userIds: string[]): Promise<Set<string>>;
}
