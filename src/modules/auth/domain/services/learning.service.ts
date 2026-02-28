/**
 * Interface cho cross-module communication: Auth → Learning Module
 *
 * Trong monolith, implementation sẽ gọi trực tiếp LearningModule's service
 * thay vì HTTP call như microservice.
 *
 * Phase 1: Stub implementation (LearningModule chưa tồn tại)
 * Phase 2: Khi LearningModule được tạo, cập nhật implementation
 */
export interface LearningService {
  initializeLearningProfile(userId: string): Promise<void>;
}
