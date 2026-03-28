import { CreateSkillPartUseCase } from './create-skill-part.usecase';
import { SkillPart } from '../../../domain/entities/skill-part.entity';

describe('CreateSkillPartUseCase', () => {
  let useCase: CreateSkillPartUseCase;
  let skillPartRepository: any;

  beforeEach(() => {
    skillPartRepository = { create: jest.fn() };
    useCase = new CreateSkillPartUseCase(skillPartRepository);
  });

  it('should create a skill part', async () => {
    const created = new SkillPart('sp1', 'Part 1', 'Desc', 1);
    skillPartRepository.create.mockResolvedValue(created);

    const result = await useCase.execute({ name: 'Part 1', description: 'Desc', position: 1 });
    expect(result.name).toBe('Part 1');
    expect(skillPartRepository.create).toHaveBeenCalled();
  });
});
