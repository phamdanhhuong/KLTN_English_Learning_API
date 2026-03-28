import { GetAllSkillPartsUseCase } from './get-all-skill-parts.usecase';
import { SkillPart } from '../../../domain/entities/skill-part.entity';

describe('GetAllSkillPartsUseCase', () => {
  let useCase: GetAllSkillPartsUseCase;
  let skillPartRepository: any;

  beforeEach(() => {
    skillPartRepository = { findAll: jest.fn() };
    useCase = new GetAllSkillPartsUseCase(skillPartRepository);
  });

  it('should return all skill parts', async () => {
    skillPartRepository.findAll.mockResolvedValue([new SkillPart('sp1', 'Part 1')]);
    const result = await useCase.execute();
    expect(result).toHaveLength(1);
  });
});
