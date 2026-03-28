import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ChangePasswordUseCase } from './change-password.usecase';
import { AuthUser } from '../../domain/entities/auth-user.entity';

describe('ChangePasswordUseCase', () => {
  let useCase: ChangePasswordUseCase;
  let authUserRepo: any;
  let hashService: any;

  const mockUser = new AuthUser({
    id: 'user-1',
    email: 'test@example.com',
    password: 'hashed-old-password',
    isActive: true,
  });

  beforeEach(() => {
    authUserRepo = {
      findById: jest.fn(),
      update: jest.fn(),
    };
    hashService = {
      compare: jest.fn(),
      hash: jest.fn().mockResolvedValue('hashed-new-password'),
    };

    useCase = new ChangePasswordUseCase(authUserRepo, hashService);
  });

  it('should change password successfully', async () => {
    authUserRepo.findById.mockResolvedValue(mockUser);
    hashService.compare.mockResolvedValue(true);

    const result = await useCase.execute('user-1', {
      currentPassword: 'old-password',
      newPassword: 'new-password',
    });

    expect(result.message).toBe('Password changed successfully');
    expect(hashService.hash).toHaveBeenCalledWith('new-password');
    expect(authUserRepo.update).toHaveBeenCalledWith('user-1', { password: 'hashed-new-password' });
  });

  it('should throw UnauthorizedException when user not found', async () => {
    authUserRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute('user-1', { currentPassword: 'old', newPassword: 'new' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw BadRequestException for social login account', async () => {
    authUserRepo.findById.mockResolvedValue(new AuthUser({ ...mockUser, password: null }));

    await expect(
      useCase.execute('user-1', { currentPassword: 'old', newPassword: 'new' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw UnauthorizedException when current password is wrong', async () => {
    authUserRepo.findById.mockResolvedValue(mockUser);
    hashService.compare.mockResolvedValue(false);

    await expect(
      useCase.execute('user-1', { currentPassword: 'wrong', newPassword: 'new' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw BadRequestException when new password equals current', async () => {
    authUserRepo.findById.mockResolvedValue(mockUser);
    hashService.compare.mockResolvedValue(true);

    await expect(
      useCase.execute('user-1', { currentPassword: 'same', newPassword: 'same' }),
    ).rejects.toThrow(BadRequestException);
  });
});
