import { ValidateSkillStructureUseCase } from './validate-skill-structure.usecase';

describe('ValidateSkillStructureUseCase', () => {
  let useCase: ValidateSkillStructureUseCase;
  let skillDomainService: any;

  beforeEach(() => {
    skillDomainService = { validateSkillStructure: jest.fn() };
    useCase = new ValidateSkillStructureUseCase(skillDomainService);
  });

  it('should return valid when structure is correct', async () => {
    skillDomainService.validateSkillStructure.mockResolvedValue(true);
    const result = await useCase.execute('skill-1');
    expect(result.isValid).toBe(true);
    expect(result.message).toContain('valid');
  });

  it('should return invalid when structure is incorrect', async () => {
    skillDomainService.validateSkillStructure.mockResolvedValue(false);
    const result = await useCase.execute('skill-1');
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('invalid');
  });
});
