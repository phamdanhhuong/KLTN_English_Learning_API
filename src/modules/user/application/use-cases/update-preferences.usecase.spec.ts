import { NotFoundException } from '@nestjs/common';
import { UpdatePreferencesUseCase } from './update-preferences.usecase';
import { UserProfile } from '../../domain/entities/user-profile.entity';

describe('UpdatePreferencesUseCase', () => {
  let useCase: UpdatePreferencesUseCase;
  let userProfileRepo: any;
  const existing = new UserProfile({
    id: 'user-1', email: 'test@example.com',
    nativeLanguage: 'vi', targetLanguage: 'en', dailyGoalMinutes: 15, timezone: 'UTC',
  });

  beforeEach(() => {
    userProfileRepo = {
      findById: jest.fn(),
      updatePreferences: jest.fn(),
    };
    useCase = new UpdatePreferencesUseCase(userProfileRepo);
  });

  it('should update preferences successfully', async () => {
    userProfileRepo.findById.mockResolvedValue(existing);
    userProfileRepo.updatePreferences.mockResolvedValue(
      new UserProfile({ ...existing, dailyGoalMinutes: 30 }),
    );

    const result = await useCase.execute('user-1', { dailyGoalMinutes: 30 });
    expect(result.dailyGoalMinutes).toBe(30);
  });

  it('should throw NotFoundException when user not found', async () => {
    userProfileRepo.findById.mockResolvedValue(null);
    await expect(
      useCase.execute('non-existent', { dailyGoalMinutes: 30 }),
    ).rejects.toThrow(NotFoundException);
  });
});
