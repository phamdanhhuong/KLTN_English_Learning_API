import { Injectable, Logger } from '@nestjs/common';
import { UserProfileService } from '../../domain/services/user-profile.service';

/**
 * STUB Implementation - Phase 1
 *
 * Khi UserModule được tạo (Phase 2), thay thế bằng implementation thực
 * gọi trực tiếp UserModule's service (inject via constructor).
 *
 * Ví dụ Phase 2:
 * ```
 * constructor(private readonly userService: UserService) {}
 * async createUserProfile(userId, email) {
 *   await this.userService.createProfile({ userId, email });
 * }
 * ```
 */
@Injectable()
export class UserProfileServiceStub implements UserProfileService {
  private readonly logger = new Logger(UserProfileServiceStub.name);

  async createUserProfile(userId: string, email: string): Promise<void> {
    this.logger.warn(
      `[STUB] createUserProfile called for userId=${userId}, email=${email}. ` +
        'Replace with real implementation when UserModule is ready.',
    );
  }

  async sendRegistrationOtp(email: string): Promise<void> {
    this.logger.warn(
      `[STUB] sendRegistrationOtp called for email=${email}. ` +
        'Replace with real implementation when UserModule is ready.',
    );
  }

  async verifyRegistrationOtp(
    email: string,
    otpCode: string,
  ): Promise<boolean> {
    this.logger.warn(
      `[STUB] verifyRegistrationOtp called for email=${email}. ` +
        'Auto-returning true. Replace when UserModule is ready.',
    );
    return true;
  }

  async createUserProfileWithDetails(
    userId: string,
    email: string,
    displayName: string,
    avatarUrl?: string,
  ): Promise<void> {
    this.logger.warn(
      `[STUB] createUserProfileWithDetails called for userId=${userId}. ` +
        'Replace with real implementation when UserModule is ready.',
    );
  }

  async sendPasswordResetOtp(email: string): Promise<void> {
    this.logger.warn(
      `[STUB] sendPasswordResetOtp called for email=${email}. ` +
        'Replace with real implementation when UserModule is ready.',
    );
  }

  async verifyPasswordResetOtp(
    email: string,
    otpCode: string,
  ): Promise<boolean> {
    this.logger.warn(
      `[STUB] verifyPasswordResetOtp called for email=${email}. ` +
        'Auto-returning true. Replace when UserModule is ready.',
    );
    return true;
  }
}
