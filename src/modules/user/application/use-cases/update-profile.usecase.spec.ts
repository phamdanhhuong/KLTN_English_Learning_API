import { NotFoundException, ConflictException } from '@nestjs/common';
import { UpdateProfileUseCase } from './update-profile.usecase';
import { UserProfile } from '../../domain/entities/user-profile.entity';

describe('UpdateProfileUseCase', () => {
  let useCase: UpdateProfileUseCase;
  let userProfileRepo: any;
  const existing = new UserProfile({
    id: 'user-1', email: 'test@example.com', username: 'olduser',
    fullName: 'Old Name', nativeLanguage: 'vi', targetLanguage: 'en',
  });

  beforeEach(() => {
    userProfileRepo = {
      findById: jest.fn(),
      findByUsername: jest.fn(),
      update: jest.fn(),
    };
    useCase = new UpdateProfileUseCase(userProfileRepo);
  });

  it('should update profile successfully', async () => {
    userProfileRepo.findById.mockResolvedValue(existing);
    userProfileRepo.update.mockResolvedValue(new UserProfile({ ...existing, fullName: 'New Name' }));

    const result = await useCase.execute('user-1', { fullName: 'New Name' });
    expect(result.fullName).toBe('New Name');
  });

  it('should update username when not taken', async () => {
    userProfileRepo.findById.mockResolvedValue(existing);
    userProfileRepo.findByUsername.mockResolvedValue(null);
    userProfileRepo.update.mockResolvedValue(new UserProfile({ ...existing, username: 'newuser' }));

    const result = await useCase.execute('user-1', { username: 'newuser' });
    expect(result.username).toBe('newuser');
  });

  it('should throw ConflictException when username is taken', async () => {
    userProfileRepo.findById.mockResolvedValue(existing);
    userProfileRepo.findByUsername.mockResolvedValue(new UserProfile({ id: 'other', username: 'taken' }));

    await expect(useCase.execute('user-1', { username: 'taken' })).rejects.toThrow(ConflictException);
  });

  it('should throw NotFoundException when user not found', async () => {
    userProfileRepo.findById.mockResolvedValue(null);
    await expect(useCase.execute('non-existent', { fullName: 'X' })).rejects.toThrow(NotFoundException);
  });
});
