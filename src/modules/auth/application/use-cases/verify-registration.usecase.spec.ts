import { BadRequestException } from '@nestjs/common';
import { VerifyRegistrationUseCase } from './verify-registration.usecase';
import { AuthUser } from '../../domain/entities/auth-user.entity';

describe('VerifyRegistrationUseCase', () => {
  let useCase: VerifyRegistrationUseCase;
  let authUserRepo: any;
  let tokenService: any;
  let refreshTokenRepo: any;
  let userProfileService: any;
  let cacheService: any;

  const mockCreatedUser = new AuthUser({
    id: 'new-user-1',
    email: 'test@example.com',
    password: 'hashed-password',
    isActive: true,
    role: { id: '1', name: 'USER', description: null, createdAt: new Date(), updatedAt: new Date() } as any,
  });

  const cachedData = JSON.stringify({
    hashedPassword: 'hashed-password',
    fullName: 'Test User',
    nativeLanguage: 'vi',
    targetLanguage: 'en',
    proficiencyLevel: 'beginner',
  });

  beforeEach(() => {
    authUserRepo = {
      findByEmail: jest.fn(),
      create: jest.fn().mockResolvedValue(mockCreatedUser),
    };
    tokenService = {
      generateAccessToken: jest.fn().mockReturnValue('access-token'),
      generateRefreshToken: jest.fn().mockReturnValue('refresh-token'),
    };
    refreshTokenRepo = { create: jest.fn() };
    userProfileService = {
      verifyRegistrationOtp: jest.fn(),
      createUserProfile: jest.fn(),
    };
    cacheService = {
      get: jest.fn(),
      del: jest.fn(),
    };

    useCase = new VerifyRegistrationUseCase(
      authUserRepo,
      tokenService,
      refreshTokenRepo,
      userProfileService,
      cacheService,
    );
  });

  it('should verify OTP and create user successfully', async () => {
    userProfileService.verifyRegistrationOtp.mockResolvedValue(true);
    cacheService.get.mockResolvedValue(cachedData);
    authUserRepo.findByEmail.mockResolvedValue(null);

    const result = await useCase.execute({ userId: 'test@example.com', otp: '123456' });

    expect(result.message).toBe('Registration successful');
    expect(result.tokens.accessToken).toBe('access-token');
    expect(result.tokens.refreshToken).toBe('refresh-token');
    expect(authUserRepo.create).toHaveBeenCalled();
    expect(cacheService.del).toHaveBeenCalledWith('register:test@example.com');
    expect(refreshTokenRepo.create).toHaveBeenCalled();
  });

  it('should throw BadRequestException for invalid OTP', async () => {
    userProfileService.verifyRegistrationOtp.mockResolvedValue(false);

    await expect(
      useCase.execute({ userId: 'test@example.com', otp: 'wrong' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException when registration session expired', async () => {
    userProfileService.verifyRegistrationOtp.mockResolvedValue(true);
    cacheService.get.mockResolvedValue(null);

    await expect(
      useCase.execute({ userId: 'test@example.com', otp: '123456' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException when email already registered', async () => {
    userProfileService.verifyRegistrationOtp.mockResolvedValue(true);
    cacheService.get.mockResolvedValue(cachedData);
    authUserRepo.findByEmail.mockResolvedValue(mockCreatedUser);

    await expect(
      useCase.execute({ userId: 'test@example.com', otp: '123456' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should still succeed even if profile creation fails', async () => {
    userProfileService.verifyRegistrationOtp.mockResolvedValue(true);
    cacheService.get.mockResolvedValue(cachedData);
    authUserRepo.findByEmail.mockResolvedValue(null);
    userProfileService.createUserProfile.mockRejectedValue(new Error('Profile service down'));

    const result = await useCase.execute({ userId: 'test@example.com', otp: '123456' });

    expect(result.message).toBe('Registration successful');
  });
});
