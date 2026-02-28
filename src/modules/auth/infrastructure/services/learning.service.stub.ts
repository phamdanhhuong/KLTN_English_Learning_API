import { Injectable, Logger } from '@nestjs/common';
import { LearningService } from '../../domain/services/learning.service';

/**
 * STUB Implementation - Phase 1
 *
 * Khi LearningModule được tạo (Phase 2), thay thế bằng implementation thực
 * gọi trực tiếp LearningModule's service.
 *
 * Ví dụ Phase 2:
 * ```
 * constructor(private readonly progressService: ProgressService) {}
 * async initializeLearningProfile(userId) {
 *   await this.progressService.createInitialProgress(userId);
 * }
 * ```
 */
@Injectable()
export class LearningServiceStub implements LearningService {
  private readonly logger = new Logger(LearningServiceStub.name);

  async initializeLearningProfile(userId: string): Promise<void> {
    this.logger.warn(
      `[STUB] initializeLearningProfile called for userId=${userId}. ` +
        'Replace with real implementation when LearningModule is ready.',
    );
  }
}
