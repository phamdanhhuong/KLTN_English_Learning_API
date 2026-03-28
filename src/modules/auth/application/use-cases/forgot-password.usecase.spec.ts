import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ForgotPasswordUseCase } from './forgot-password.usecase';
import { AuthUser } from '../../domain/entities/auth-user.entity';

describe('ForgotPasswordUseCase', () => {
  let useCase: ForgotPasswordUseCase;
  let authUserRepo: any;
  let hashService: any;
  let userProfileService: any;

  const mockUser = new AuthUser({
    id: 'user-1',
    email: 'test@example.com',
    password: 'hashed-password',
    isActive: true,
  });

  beforeEach(() => {
    authUserRepo = {
      findByEmail: jest.fn(),
      update: jest.fn(),
    };
    hashService = {
      hash: jest.fn().mockResolvedValue('hashed-new-password'),
    };
    userProfileService = {
      sendPasswordResetOtp: jest.fn(),
      verifyPasswordResetOtp: jest.fn(),
    };

    useCase = new ForgotPasswordUseCase(authUserRepo, hashService, userProfileService);
  });

  describe('sendResetOtp', () => {
    it('should send OTP when user exists', async () => {
      authUserRepo.findByEmail.mockResolvedValue(mockUser);

      const result = await useCase.sendResetOtp({ email: 'test@example.com' });

      expect(result.message).toContain('OTP has been sent');
      expect(userProfileService.sendPasswordResetOtp).toHaveBeenCalledWith('test@example.com');
    });

    it('should return same message when user does not exist (security)', async () => {
      authUserRepo.findByEmail.mockResolvedValue(null);

      const result = await useCase.sendResetOtp({ email: 'unknown@example.com' });

      expect(result.message).toContain('OTP has been sent');
      expect(userProfileService.sendPasswordResetOtp).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid OTP', async () => {
      userProfileService.verifyPasswordResetOtp.mockResolvedValue(true);
      authUserRepo.findByEmail.mockResolvedValue(mockUser);

      const result = await useCase.resetPassword({
        email: 'test@example.com',
        otpCode: '123456',
        newPassword: 'new-password',
      });

      expect(result.message).toBe('Password reset successfully');
      expect(hashService.hash).toHaveBeenCalledWith('new-password');
      expect(authUserRepo.update).toHaveBeenCalledWith('user-1', { password: 'hashed-new-password' });
    });

    it('should throw BadRequestException for invalid OTP', async () => {
      userProfileService.verifyPasswordResetOtp.mockResolvedValue(false);

      await expect(
        useCase.resetPassword({ email: 'test@example.com', otpCode: 'wrong', newPassword: 'new' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when user not found after OTP verified', async () => {
      userProfileService.verifyPasswordResetOtp.mockResolvedValue(true);
      authUserRepo.findByEmail.mockResolvedValue(null);

      await expect(
        useCase.resetPassword({ email: 'test@example.com', otpCode: '123456', newPassword: 'new' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
