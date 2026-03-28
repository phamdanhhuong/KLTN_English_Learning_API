import { GetSkillPartByIdUseCase } from './get-skill-part-by-id.usecase';
import { SkillPart } from '../../../domain/entities/skill-part.entity';

describe('GetSkillPartByIdUseCase', () => {
  let useCase: GetSkillPartByIdUseCase;
  let skillPartRepository: any;

  beforeEach(() => {
    skillPartRepository = { findById: jest.fn() };
    useCase = new GetSkillPartByIdUseCase(skillPartRepository);
  });

  it('should return skill part when found', async () => {
    skillPartRepository.findById.mockResolvedValue(new SkillPart('sp1', 'Part 1'));
    const result = await useCase.execute('sp1');
    expect(result?.name).toBe('Part 1');
  });

  it('should return null when not found', async () => {
    skillPartRepository.findById.mockResolvedValue(null);
    const result = await useCase.execute('non-existent');
    expect(result).toBeNull();
  });
});
