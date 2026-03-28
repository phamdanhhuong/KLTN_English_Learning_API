import { CreateSkillUseCase } from './create-skill.usecase';
import { Skill } from '../../../domain/entities/skill.entity';

describe('CreateSkillUseCase', () => {
  let useCase: CreateSkillUseCase;
  let skillDomainService: any;

  beforeEach(() => {
    skillDomainService = { createSkillWithLevels: jest.fn() };
    useCase = new CreateSkillUseCase(skillDomainService);
  });

  it('should create a skill with levels and return DTO', async () => {
    const skill = new Skill('skill-1', 'Grammar', 'Grammar skills', 1, 'part-1');
    skillDomainService.createSkillWithLevels.mockResolvedValue(skill);

    const result = await useCase.execute({ title: 'Grammar', description: 'Grammar skills', position: 1, partId: 'part-1' });

    expect(result.id).toBe('skill-1');
    expect(result.title).toBe('Grammar');
    expect(skillDomainService.createSkillWithLevels).toHaveBeenCalledWith('Grammar', 'Grammar skills', 1, 'part-1');
  });
});
