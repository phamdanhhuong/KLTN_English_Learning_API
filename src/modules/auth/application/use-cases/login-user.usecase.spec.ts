import { UnauthorizedException } from '@nestjs/common';
import { LoginUserUseCase } from './login-user.usecase';
import { AuthUser } from '../../domain/entities/auth-user.entity';

describe('LoginUserUseCase', () => {
  let useCase: LoginUserUseCase;
  let authUserRepo: any;
  let hashService: any;
  let tokenService: any;
  let refreshTokenRepo: any;

  const mockUser = new AuthUser({
    id: 'user-1',
    email: 'test@example.com',
    password: 'hashed-password',
    isActive: true,
    role: { id: '1', name: 'USER', description: null, createdAt: new Date(), updatedAt: new Date() } as any,
  });

  beforeEach(() => {
    authUserRepo = {
      findByEmail: jest.fn(),
      update: jest.fn(),
    };
    hashService = {
      compare: jest.fn(),
    };
    tokenService = {
      generateAccessToken: jest.fn().mockReturnValue('access-token'),
      generateRefreshToken: jest.fn().mockReturnValue('refresh-token'),
    };
    refreshTokenRepo = {
      create: jest.fn(),
    };

    useCase = new LoginUserUseCase(
      authUserRepo,
      hashService,
      tokenService,
      refreshTokenRepo,
    );
  });

  it('should login successfully with valid credentials', async () => {
    authUserRepo.findByEmail.mockResolvedValue(mockUser);
    hashService.compare.mockResolvedValue(true);
    authUserRepo.update.mockResolvedValue(mockUser);

    const result = await useCase.execute({ email: 'test@example.com', password: 'password123' });

    expect(result.tokens.accessToken).toBe('access-token');
    expect(result.tokens.refreshToken).toBe('refresh-token');
    expect(result.user.email).toBe('test@example.com');
    expect(authUserRepo.update).toHaveBeenCalledWith('user-1', expect.objectContaining({ lastLoginAt: expect.any(Date) }));
    expect(refreshTokenRepo.create).toHaveBeenCalled();
  });

  it('should throw UnauthorizedException when email not found', async () => {
    authUserRepo.findByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({ email: 'wrong@example.com', password: 'password123' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when account is deactivated', async () => {
    authUserRepo.findByEmail.mockResolvedValue(new AuthUser({ ...mockUser, isActive: false }));

    await expect(
      useCase.execute({ email: 'test@example.com', password: 'password123' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException for social login account without password', async () => {
    authUserRepo.findByEmail.mockResolvedValue(new AuthUser({ ...mockUser, password: null }));

    await expect(
      useCase.execute({ email: 'test@example.com', password: 'password123' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when password is invalid', async () => {
    authUserRepo.findByEmail.mockResolvedValue(mockUser);
    hashService.compare.mockResolvedValue(false);

    await expect(
      useCase.execute({ email: 'test@example.com', password: 'wrong-password' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
