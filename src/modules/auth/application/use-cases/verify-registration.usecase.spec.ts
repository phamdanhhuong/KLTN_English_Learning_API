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
  let prismaService: any;
  let questService: any;
  let chatbotClient: any;

  const mockCreatedUser = new AuthUser({
    id: 'new-user-1',
    email: 'test@example.com',
    password: 'hashed-password',
    isActive: true,
    role: {
      id: '1',
      name: 'USER',
      description: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any,
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
    prismaService = {
      roadmap: {
        findFirst: jest.fn().mockResolvedValue({ id: 'roadmap-id', milestones: [{ id: 'm1', milestoneSkills: [{ skillId: 'skill-1' }] }] }),
        findMany: jest.fn().mockResolvedValue([{ id: 'roadmap-id', title: 'General English', targetGoal: 'CONNECT' }]),
        findUnique: jest.fn().mockResolvedValue({ id: 'ai-roadmap-id', milestones: [{ id: 'm1', milestoneSkills: [{ skillId: 'skill-ai' }] }] }),
        create: jest.fn().mockResolvedValue({ id: 'new-ai-roadmap', milestones: [{ id: 'm1', title: 'M1', targetLevel: 'BEGINNER', milestoneSkills: [] }] }),
      },
      userRoadmap: {
        create: jest.fn().mockResolvedValue({}),
      },
      skillProgress: {
        create: jest.fn().mockResolvedValue({}),
      },
      skillPart: {
        findFirst: jest.fn().mockResolvedValue({ id: 'part-1' }),
        create: jest.fn().mockResolvedValue({ id: 'part-1' }),
      },
      skill: {
        create: jest.fn().mockResolvedValue({ id: 'new-skill' }),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({ id: 'user-1', profile: {} }),
      },
    };
    questService = {
      checkAndInitQuests: jest.fn().mockResolvedValue(undefined),
    };
    chatbotClient = {
      recommendRoadmap: jest.fn().mockResolvedValue({ roadmapId: 'ai-roadmap-id' }),
      generateRoadmap: jest.fn().mockResolvedValue({ title: 'AI Map', targetGoal: 'CONNECT', description: 'desc', milestones: [] }),
      generateSkill: jest.fn().mockResolvedValue({ title: 'AI Skill', description: 'desc', lessons: [] }),
      generateExercises: jest.fn().mockResolvedValue({ exercises: [] }),
    };

    useCase = new VerifyRegistrationUseCase(
      authUserRepo,
      tokenService,
      refreshTokenRepo,
      userProfileService,
      cacheService,
      prismaService,
      questService,
      chatbotClient,
    );
  });

  it('should verify OTP and create user successfully', async () => {
    userProfileService.verifyRegistrationOtp.mockResolvedValue(true);
    cacheService.get.mockResolvedValue(cachedData);
    authUserRepo.findByEmail.mockResolvedValue(null);

    const result = await useCase.execute({
      userId: 'test@example.com',
      otp: '123456',
    });

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
    userProfileService.createUserProfile.mockRejectedValue(
      new Error('Profile service down'),
    );

    const result = await useCase.execute({
      userId: 'test@example.com',
      otp: '123456',
    });

    expect(result.message).toBe('Registration successful');
  });

  it('should fall back to deterministic roadmap when AI fails', async () => {
    userProfileService.verifyRegistrationOtp.mockResolvedValue(true);
    cacheService.get.mockResolvedValue(cachedData);
    authUserRepo.findByEmail.mockResolvedValue(null);
    chatbotClient.recommendRoadmap.mockRejectedValue(
      new Error('AI service timeout'),
    );
    chatbotClient.generateRoadmap.mockRejectedValue(
      new Error('AI generation timeout'),
    );

    const result = await useCase.execute({
      userId: 'test@example.com',
      otp: '123456',
    });

    expect(result.message).toBe('Registration successful');
    expect(chatbotClient.recommendRoadmap).toHaveBeenCalled();
    // Should have fallen back to findFirst (deterministic)
    expect(prismaService.roadmap.findFirst).toHaveBeenCalled();
  });

  it('should generate roadmap and skill using AI when no match is found', async () => {
    userProfileService.verifyRegistrationOtp.mockResolvedValue(true);
    cacheService.get.mockResolvedValue(cachedData);
    authUserRepo.findByEmail.mockResolvedValue(null);
    // Force recommendRoadmap to fail
    chatbotClient.recommendRoadmap.mockRejectedValue(new Error('timeout'));
    // Force findFirst to return null so it falls back to generation
    prismaService.roadmap.findFirst.mockResolvedValue(null);

    const result = await useCase.execute({
      userId: 'test@example.com',
      otp: '123456',
    });

    expect(result.message).toBe('Registration successful');
    expect(chatbotClient.generateRoadmap).toHaveBeenCalled();
    expect(chatbotClient.generateSkill).toHaveBeenCalled();
    expect(prismaService.roadmap.create).toHaveBeenCalled();
    expect(prismaService.skill.create).toHaveBeenCalled();
  });
});
