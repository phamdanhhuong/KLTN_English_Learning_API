import { Injectable, Logger } from '@nestjs/common';
import { LearningService } from '../../domain/services/learning.service';

/**
 * LearningService implementation.
 *
 * Profile initialization (gamification records, league tier, achievement rows)
 * is now handled entirely by UserProfileRepository.create() / createWithDetails().
 * This service is kept for interface compliance but initializeLearningProfile
 * is a no-op to avoid duplicate record creation.
 */
@Injectable()
export class LearningServiceImpl implements LearningService {
  private readonly logger = new Logger(LearningServiceImpl.name);

  /**
   * No-op: all initialization is now done in UserProfileRepository.create().
   * Kept for backward compatibility with the LearningService interface.
   */
  async initializeLearningProfile(userId: string): Promise<void> {
    this.logger.log(
      `initializeLearningProfile called for userId=${userId} (no-op, handled by profile repo)`,
    );
  }
}
