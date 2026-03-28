import { NotFoundException } from '@nestjs/common';
import { DeleteSkillPartUseCase } from './delete-skill-part.usecase';
import { SkillPart } from '../../../domain/entities/skill-part.entity';

describe('DeleteSkillPartUseCase', () => {
  let useCase: DeleteSkillPartUseCase;
  let skillPartRepository: any;

  beforeEach(() => {
    skillPartRepository = { findById: jest.fn(), delete: jest.fn() };
    useCase = new DeleteSkillPartUseCase(skillPartRepository);
  });

  it('should delete an existing skill part', async () => {
    skillPartRepository.findById.mockResolvedValue(new SkillPart('sp1', 'Part 1'));
    await useCase.execute('sp1');
    expect(skillPartRepository.delete).toHaveBeenCalledWith('sp1');
  });

  it('should throw NotFoundException when not found', async () => {
    skillPartRepository.findById.mockResolvedValue(null);
    await expect(useCase.execute('non-existent')).rejects.toThrow(NotFoundException);
  });
});
