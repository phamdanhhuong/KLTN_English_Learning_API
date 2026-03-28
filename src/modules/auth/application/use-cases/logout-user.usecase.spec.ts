import { LogoutUserUseCase } from './logout-user.usecase';

describe('LogoutUserUseCase', () => {
  let useCase: LogoutUserUseCase;
  let refreshTokenRepo: any;
  let cacheService: any;

  beforeEach(() => {
    refreshTokenRepo = { revokeByUserId: jest.fn() };
    cacheService = { set: jest.fn() };

    useCase = new LogoutUserUseCase(refreshTokenRepo, cacheService);
  });

  it('should revoke refresh tokens and blacklist access token', async () => {
    const result = await useCase.execute('user-1', 'access-token-value');

    expect(result.message).toBe('Logged out successfully');
    expect(refreshTokenRepo.revokeByUserId).toHaveBeenCalledWith('user-1');
    expect(cacheService.set).toHaveBeenCalledWith(
      'blacklist:access-token-value',
      'revoked',
      3600,
    );
  });
});
