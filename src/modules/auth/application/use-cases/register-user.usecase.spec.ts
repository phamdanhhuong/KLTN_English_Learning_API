import { ConflictException } from '@nestjs/common';
import { RegisterUserUseCase } from './register-user.usecase';
import { AuthUser } from '../../domain/entities/auth-user.entity';

describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;
  let authUserRepo: any;
  let hashService: any;
  let cacheService: any;
  let userProfileService: any;

  const registerDto = {
    email: 'new@example.com',
    password: 'password123',
    fullName: 'Test User',
    profilePictureUrl: undefined,
    dateOfBirth: undefined,
    gender: undefined,
    nativeLanguage: 'vi',
    targetLanguage: 'en',
    proficiencyLevel: 'beginner',
    learningGoals: ['speaking'],
    dailyGoalMinutes: 15,
    timezone: 'Asia/Ho_Chi_Minh',
    studyReminder: undefined,
    reminderTime: undefined,
  };

  beforeEach(() => {
    authUserRepo = { findByEmail: jest.fn() };
    hashService = { hash: jest.fn().mockResolvedValue('hashed-password') };
    cacheService = { set: jest.fn() };
    userProfileService = { sendRegistrationOtp: jest.fn() };

    useCase = new RegisterUserUseCase(
      authUserRepo,
      hashService,
      cacheService,
      userProfileService,
    );
  });

  it('should register successfully and send OTP', async () => {
    authUserRepo.findByEmail.mockResolvedValue(null);

    const result = await useCase.execute(registerDto);

    expect(result.message).toContain('OTP sent');
    expect(result.userId).toBe('new@example.com');
    expect(hashService.hash).toHaveBeenCalledWith('password123');
    expect(cacheService.set).toHaveBeenCalledWith(
      'register:new@example.com',
      expect.any(String),
      600,
    );
    expect(userProfileService.sendRegistrationOtp).toHaveBeenCalledWith('new@example.com');
  });

  it('should throw ConflictException when email already exists', async () => {
    authUserRepo.findByEmail.mockResolvedValue(new AuthUser({ id: 'existing', email: 'new@example.com' }));

    await expect(useCase.execute(registerDto)).rejects.toThrow(ConflictException);
  });
});
