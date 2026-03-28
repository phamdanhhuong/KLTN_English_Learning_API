import { NotFoundException } from '@nestjs/common';
import { UpdateSkillPartUseCase } from './update-skill-part.usecase';
import { SkillPart } from '../../../domain/entities/skill-part.entity';

describe('UpdateSkillPartUseCase', () => {
  let useCase: UpdateSkillPartUseCase;
  let skillPartRepository: any;
  const existing = new SkillPart('sp1', 'Old Name', 'Old Desc', 1);

  beforeEach(() => {
    skillPartRepository = { findById: jest.fn(), update: jest.fn() };
    useCase = new UpdateSkillPartUseCase(skillPartRepository);
  });

  it('should update skill part name', async () => {
    skillPartRepository.findById.mockResolvedValue(existing);
    skillPartRepository.update.mockImplementation((sp: SkillPart) => Promise.resolve(sp));

    const result = await useCase.execute('sp1', { name: 'New Name' });
    expect(result.name).toBe('New Name');
  });

  it('should throw NotFoundException when not found', async () => {
    skillPartRepository.findById.mockResolvedValue(null);
    await expect(useCase.execute('non-existent', { name: 'X' })).rejects.toThrow(NotFoundException);
  });
});
