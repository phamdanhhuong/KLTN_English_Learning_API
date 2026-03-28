import { UnauthorizedException } from '@nestjs/common';
import { GoogleLoginUseCase } from './google-login.usecase';
import { AuthUser } from '../../domain/entities/auth-user.entity';

// Mock google-auth-library
jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: jest.fn().mockResolvedValue({
      getPayload: () => ({
        sub: 'google-123',
        email: 'google@example.com',
        name: 'Google User',
        picture: 'https://photo.url',
        email_verified: true,
      }),
    }),
  })),
}));

describe('GoogleLoginUseCase', () => {
  let useCase: GoogleLoginUseCase;
  let authUserRepo: any;
  let tokenService: any;
  let refreshTokenRepo: any;
  let userProfileService: any;
  let learningService: any;
  let configService: any;

  const mockUser = new AuthUser({
    id: 'user-1',
    email: 'google@example.com',
    googleId: 'google-123',
    isActive: true,
    role: { id: '1', name: 'USER', description: null, createdAt: new Date(), updatedAt: new Date() } as any,
  });

  beforeEach(() => {
    authUserRepo = {
      findByGoogleId: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };
    tokenService = {
      generateAccessToken: jest.fn().mockReturnValue('access-token'),
      generateRefreshToken: jest.fn().mockReturnValue('refresh-token'),
    };
    refreshTokenRepo = { create: jest.fn() };
    userProfileService = { createUserProfileWithDetails: jest.fn() };
    learningService = { initializeLearningProfile: jest.fn() };
    configService = { get: jest.fn().mockReturnValue('google-client-id') };

    useCase = new GoogleLoginUseCase(
      authUserRepo,
      tokenService,
      refreshTokenRepo,
      userProfileService,
      learningService,
      configService,
    );
  });

  it('should login existing Google user', async () => {
    authUserRepo.findByGoogleId.mockResolvedValue(mockUser);
    authUserRepo.update.mockResolvedValue(mockUser);

    const result = await useCase.execute('valid-google-token');

    expect(result.isNewUser).toBe(false);
    expect(result.tokens.accessToken).toBe('access-token');
    expect(authUserRepo.update).toHaveBeenCalledWith('user-1', expect.objectContaining({ lastLoginAt: expect.any(Date) }));
  });

  it('should link Google account to existing email user', async () => {
    const emailUser = new AuthUser({ ...mockUser, googleId: null });
    authUserRepo.findByGoogleId.mockResolvedValue(null);
    authUserRepo.findByEmail.mockResolvedValue(emailUser);
    authUserRepo.update
      .mockResolvedValueOnce(mockUser) // link google
      .mockResolvedValueOnce(mockUser); // update lastLogin

    const result = await useCase.execute('valid-google-token');

    expect(result.isNewUser).toBe(false);
    expect(authUserRepo.update).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ googleId: 'google-123', isEmailVerified: true }),
    );
  });

  it('should create new user for unregistered Google account', async () => {
    authUserRepo.findByGoogleId.mockResolvedValue(null);
    authUserRepo.findByEmail.mockResolvedValue(null);
    authUserRepo.create.mockResolvedValue(mockUser);
    authUserRepo.update.mockResolvedValue(mockUser);

    const result = await useCase.execute('valid-google-token');

    expect(result.isNewUser).toBe(true);
    expect(authUserRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'google@example.com', googleId: 'google-123' }),
    );
    expect(userProfileService.createUserProfileWithDetails).toHaveBeenCalled();
  });

  it('should throw UnauthorizedException for invalid Google token', async () => {
    // Override mock to throw
    const { OAuth2Client } = require('google-auth-library');
    OAuth2Client.mockImplementationOnce(() => ({
      verifyIdToken: jest.fn().mockRejectedValue(new Error('Invalid token')),
    }));

    // Need a fresh instance with the overridden mock
    const freshUseCase = new GoogleLoginUseCase(
      authUserRepo,
      tokenService,
      refreshTokenRepo,
      userProfileService,
      learningService,
      configService,
    );

    await expect(freshUseCase.execute('bad-token')).rejects.toThrow(UnauthorizedException);
  });
});
