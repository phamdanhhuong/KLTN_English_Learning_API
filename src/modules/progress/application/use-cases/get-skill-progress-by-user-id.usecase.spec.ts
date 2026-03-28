import { GetSkillProgressByUserIdUseCase } from './get-skill-progress-by-user-id.usecase';
import { SkillProgressEntity } from '../../domain/entities/skill-progress.entity';

describe('GetSkillProgressByUserIdUseCase', () => {
  let useCase: GetSkillProgressByUserIdUseCase;
  let skillProgressRepository: any;

  beforeEach(() => {
    skillProgressRepository = { findByUserId: jest.fn() };
    useCase = new GetSkillProgressByUserIdUseCase(skillProgressRepository);
  });

  it('should return progress DTO when found', async () => {
    const entity = new SkillProgressEntity('user-1', 'skill-1', 3, 2, new Date());
    skillProgressRepository.findByUserId.mockResolvedValue(entity);

    const result = await useCase.execute('user-1');
    expect(result).toBeDefined();
    expect(result!.userId).toBe('user-1');
    expect(result!.levelReached).toBe(3);
    expect(result!.completionPercentage).toBe(43); // Math.round(3/7 * 100)
  });

  it('should return null when no progress found', async () => {
    skillProgressRepository.findByUserId.mockResolvedValue(null);
    const result = await useCase.execute('user-1');
    expect(result).toBeNull();
  });
});
