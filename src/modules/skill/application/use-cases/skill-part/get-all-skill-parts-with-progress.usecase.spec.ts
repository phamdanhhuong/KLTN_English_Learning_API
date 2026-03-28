import { GetAllSkillPartsWithProgressUseCase } from './get-all-skill-parts-with-progress.usecase';

describe('GetAllSkillPartsWithProgressUseCase', () => {
  let useCase: GetAllSkillPartsWithProgressUseCase;
  let skillPartRepository: any;

  beforeEach(() => {
    skillPartRepository = { findWithProgress: jest.fn() };
    useCase = new GetAllSkillPartsWithProgressUseCase(skillPartRepository);
  });

  it('should return skill parts with progress for a user', async () => {
    const mockData = [{
      id: 'sp1', name: 'Part 1', position: 1, totalSkills: 5,
      completedSkills: 2, progressPercentage: 40, skills: [],
      createdAt: new Date(), updatedAt: new Date(),
    }];
    skillPartRepository.findWithProgress.mockResolvedValue(mockData);

    const result = await useCase.execute('user-1');
    expect(result).toHaveLength(1);
    expect(result[0].progressPercentage).toBe(40);
    expect(skillPartRepository.findWithProgress).toHaveBeenCalledWith('user-1');
  });
});
