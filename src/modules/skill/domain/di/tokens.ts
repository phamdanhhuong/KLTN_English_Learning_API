// Repository tokens for dependency injection
export const SKILL_REPOSITORY = Symbol('SKILL_REPOSITORY');
export const SKILL_LEVEL_REPOSITORY = Symbol('SKILL_LEVEL_REPOSITORY');
export const LESSON_REPOSITORY = Symbol('LESSON_REPOSITORY');
export const EXERCISE_REPOSITORY = Symbol('EXERCISE_REPOSITORY');
export const SKILL_PART_REPOSITORY = Symbol('SKILL_PART_REPOSITORY');

// Service tokens for dependency injection
export const SKILL_DOMAIN_SERVICE = Symbol('SKILL_DOMAIN_SERVICE');

// Namespace export for convenience
export const SKILL_TOKENS = {
  SKILL_REPOSITORY,
  SKILL_LEVEL_REPOSITORY,
  LESSON_REPOSITORY,
  EXERCISE_REPOSITORY,
  SKILL_PART_REPOSITORY,
  SKILL_DOMAIN_SERVICE,
};
