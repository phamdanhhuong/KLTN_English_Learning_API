import { UnauthorizedException } from '@nestjs/common';
import { RefreshTokenUseCase } from './refresh-token.usecase';
import { AuthUser } from '../../domain/entities/auth-user.entity';
import { RefreshToken } from '../../domain/entities/refresh-token.entity';

describe('RefreshTokenUseCase', () => {
  let useCase: RefreshTokenUseCase;
  let refreshTokenRepo: any;
  let tokenService: any;
  let authUserRepo: any;

  const mockUser = new AuthUser({
    id: 'user-1',
    email: 'test@example.com',
    isActive: true,
    role: { id: '1', name: 'USER', description: null, createdAt: new Date(), updatedAt: new Date() } as any,
  });

  const mockStoredToken = new RefreshToken({
    id: 'rt-1',
    token: 'valid-refresh-token',
    userId: 'user-1',
    isRevoked: false,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // future
  });

  beforeEach(() => {
    refreshTokenRepo = {
      findByToken: jest.fn(),
      revokeByToken: jest.fn(),
      create: jest.fn(),
    };
    tokenService = {
      verifyRefreshToken: jest.fn().mockReturnValue({ sub: 'user-1', email: 'test@example.com', role: 'USER' }),
      generateAccessToken: jest.fn().mockReturnValue('new-access-token'),
      generateRefreshToken: jest.fn().mockReturnValue('new-refresh-token'),
    };
    authUserRepo = { findById: jest.fn() };

    useCase = new RefreshTokenUseCase(refreshTokenRepo, tokenService, authUserRepo);
  });

  it('should rotate tokens successfully', async () => {
    refreshTokenRepo.findByToken.mockResolvedValue(mockStoredToken);
    authUserRepo.findById.mockResolvedValue(mockUser);

    const result = await useCase.execute('valid-refresh-token');

    expect(result.tokens.accessToken).toBe('new-access-token');
    expect(result.tokens.refreshToken).toBe('new-refresh-token');
    expect(refreshTokenRepo.revokeByToken).toHaveBeenCalledWith('valid-refresh-token');
    expect(refreshTokenRepo.create).toHaveBeenCalled();
  });

  it('should throw UnauthorizedException for invalid token signature', async () => {
    tokenService.verifyRefreshToken.mockImplementation(() => {
      throw new Error('invalid');
    });

    await expect(useCase.execute('bad-token')).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException for revoked token', async () => {
    refreshTokenRepo.findByToken.mockResolvedValue(
      new RefreshToken({ ...mockStoredToken, isRevoked: true }),
    );

    await expect(useCase.execute('valid-refresh-token')).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException for expired token', async () => {
    refreshTokenRepo.findByToken.mockResolvedValue(
      new RefreshToken({ ...mockStoredToken, expiresAt: new Date(Date.now() - 1000) }),
    );

    await expect(useCase.execute('valid-refresh-token')).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when user not found', async () => {
    refreshTokenRepo.findByToken.mockResolvedValue(mockStoredToken);
    authUserRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute('valid-refresh-token')).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when user is deactivated', async () => {
    refreshTokenRepo.findByToken.mockResolvedValue(mockStoredToken);
    authUserRepo.findById.mockResolvedValue(new AuthUser({ ...mockUser, isActive: false }));

    await expect(useCase.execute('valid-refresh-token')).rejects.toThrow(UnauthorizedException);
  });
});
