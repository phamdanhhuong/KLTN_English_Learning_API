/**
 * Interface cho cross-module communication: Auth → User Module
 *
 * Trong monolith, implementation sẽ gọi trực tiếp UserModule's service
 * thay vì HTTP call như microservice.
 *
 * Phase 1: Stub implementation (UserModule chưa tồn tại)
 * Phase 2: Khi UserModule được tạo, cập nhật implementation
 */
export interface UserProfileService {
  createUserProfile(userId: string, email: string): Promise<void>;
  sendRegistrationOtp(email: string): Promise<void>;
  verifyRegistrationOtp(email: string, otpCode: string): Promise<boolean>;
  createUserProfileWithDetails(
    userId: string,
    email: string,
    displayName: string,
    avatarUrl?: string,
  ): Promise<void>;
  sendPasswordResetOtp(email: string): Promise<void>;
  verifyPasswordResetOtp(email: string, otpCode: string): Promise<boolean>;
}
