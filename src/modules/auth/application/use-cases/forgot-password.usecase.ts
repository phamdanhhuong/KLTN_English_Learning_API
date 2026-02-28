import {
  Inject,
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { AUTH_TOKENS } from '../../domain/di/tokens';
import { AuthUserRepository } from '../../domain/repositories/auth-user.repository';
import { HashService } from '../../domain/services/hash.service';
import { UserProfileService } from '../../domain/services/user-profile.service';
import { ForgotPasswordDto, ResetPasswordDto } from '../dto/password.dto';

@Injectable()
export class ForgotPasswordUseCase {
  constructor(
    @Inject(AUTH_TOKENS.AUTH_USER_REPOSITORY)
    private readonly authUserRepo: AuthUserRepository,
    @Inject(AUTH_TOKENS.HASH_SERVICE)
    private readonly hashService: HashService,
    @Inject(AUTH_TOKENS.USER_PROFILE_SERVICE)
    private readonly userProfileService: UserProfileService,
  ) {}

  async sendResetOtp(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.authUserRepo.findByEmail(dto.email);
    if (!user) {
      // Don't reveal whether email exists (security best practice)
      return { message: 'If the email exists, an OTP has been sent.' };
    }

    await this.userProfileService.sendPasswordResetOtp(dto.email);

    return { message: 'If the email exists, an OTP has been sent.' };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    // Verify OTP
    const isValid = await this.userProfileService.verifyPasswordResetOtp(
      dto.email,
      dto.otpCode,
    );
    if (!isValid) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Find user
    const user = await this.authUserRepo.findByEmail(dto.email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Hash and update password
    const hashedPassword = await this.hashService.hash(dto.newPassword);
    await this.authUserRepo.update(user.id, { password: hashedPassword });

    return { message: 'Password reset successfully' };
  }
}
