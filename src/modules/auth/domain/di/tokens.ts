export const AUTH_TOKENS = {
  // Repositories
  AUTH_USER_REPOSITORY: Symbol('AUTH_USER_REPOSITORY'),
  REFRESH_TOKEN_REPOSITORY: Symbol('REFRESH_TOKEN_REPOSITORY'),

  // Services
  HASH_SERVICE: Symbol('HASH_SERVICE'),
  TOKEN_SERVICE: Symbol('TOKEN_SERVICE'),
  CACHE_SERVICE: Symbol('CACHE_SERVICE'),

  // Cross-module services (stubs until modules are built)
  USER_PROFILE_SERVICE: Symbol('USER_PROFILE_SERVICE'),
  LEARNING_SERVICE: Symbol('LEARNING_SERVICE'),
} as const;
