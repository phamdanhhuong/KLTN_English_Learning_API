import { UnauthorizedException } from '@nestjs/common';
import { FacebookLoginUseCase } from './facebook-login.usecase';
import { AuthUser } from '../../domain/entities/auth-user.entity';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('FacebookLoginUseCase', () => {
  let useCase: FacebookLoginUseCase;
  let authUserRepo: any;
  let tokenService: any;
  let refreshTokenRepo: any;
  let userProfileService: any;
  let learningService: any;
  let configService: any;

  const mockUser = new AuthUser({
    id: 'user-1',
    email: 'fb@example.com',
    facebookId: 'fb-123',
    isActive: true,
    role: { id: '1', name: 'USER', description: null, createdAt: new Date(), updatedAt: new Date() } as any,
  });

  const fbProfileResponse = {
    data: {
      id: 'fb-123',
      email: 'fb@example.com',
      name: 'Facebook User',
      picture: { data: { url: 'https://fb-photo.url' } },
    },
  };

  beforeEach(() => {
    authUserRepo = {
      findByFacebookId: jest.fn(),
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
    configService = { get: jest.fn() };

    useCase = new FacebookLoginUseCase(
      authUserRepo,
      tokenService,
      refreshTokenRepo,
      userProfileService,
      learningService,
      configService,
    );

    mockedAxios.get.mockResolvedValue(fbProfileResponse);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should login existing Facebook user', async () => {
    authUserRepo.findByFacebookId.mockResolvedValue(mockUser);
    authUserRepo.update.mockResolvedValue(mockUser);

    const result = await useCase.execute('valid-fb-token');

    expect(result.isNewUser).toBe(false);
    expect(result.tokens.accessToken).toBe('access-token');
    expect(authUserRepo.update).toHaveBeenCalledWith('user-1', expect.objectContaining({ lastLoginAt: expect.any(Date) }));
  });

  it('should link Facebook account to existing email user', async () => {
    const emailUser = new AuthUser({ ...mockUser, facebookId: null });
    authUserRepo.findByFacebookId.mockResolvedValue(null);
    authUserRepo.findByEmail.mockResolvedValue(emailUser);
    authUserRepo.update
      .mockResolvedValueOnce(mockUser) // link facebook
      .mockResolvedValueOnce(mockUser); // update lastLogin

    const result = await useCase.execute('valid-fb-token');

    expect(result.isNewUser).toBe(false);
    expect(authUserRepo.update).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ facebookId: 'fb-123', isEmailVerified: true }),
    );
  });

  it('should create new user for unregistered Facebook account', async () => {
    authUserRepo.findByFacebookId.mockResolvedValue(null);
    authUserRepo.findByEmail.mockResolvedValue(null);
    authUserRepo.create.mockResolvedValue(mockUser);
    authUserRepo.update.mockResolvedValue(mockUser);

    const result = await useCase.execute('valid-fb-token');

    expect(result.isNewUser).toBe(true);
    expect(authUserRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'fb@example.com', facebookId: 'fb-123' }),
    );
    expect(userProfileService.createUserProfileWithDetails).toHaveBeenCalled();
  });

  it('should throw UnauthorizedException for invalid Facebook token', async () => {
    mockedAxios.get.mockRejectedValue(new Error('Invalid token'));

    await expect(useCase.execute('bad-token')).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when Facebook account has no email', async () => {
    mockedAxios.get.mockResolvedValue({ data: { id: 'fb-123', name: 'No Email User' } });

    await expect(useCase.execute('valid-fb-token')).rejects.toThrow(UnauthorizedException);
  });
});
