import { GetAllSkillsUseCase } from './get-all-skills.usecase';
import { Skill } from '../../../domain/entities/skill.entity';

describe('GetAllSkillsUseCase', () => {
  let useCase: GetAllSkillsUseCase;
  let skillRepository: any;

  beforeEach(() => {
    skillRepository = { findByPosition: jest.fn() };
    useCase = new GetAllSkillsUseCase(skillRepository);
  });

  it('should return all skills sorted by position', async () => {
    const skills = [new Skill('s1', 'Grammar', undefined, 1), new Skill('s2', 'Vocabulary', undefined, 2)];
    skillRepository.findByPosition.mockResolvedValue(skills);
    const result = await useCase.execute();
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('s1');
  });

  it('should return empty array when no skills exist', async () => {
    skillRepository.findByPosition.mockResolvedValue([]);
    const result = await useCase.execute();
    expect(result).toHaveLength(0);
  });
});
