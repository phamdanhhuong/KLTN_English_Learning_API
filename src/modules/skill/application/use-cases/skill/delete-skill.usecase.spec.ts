import { NotFoundException } from '@nestjs/common';
import { DeleteSkillUseCase } from './delete-skill.usecase';
import { Skill } from '../../../domain/entities/skill.entity';

describe('DeleteSkillUseCase', () => {
  let useCase: DeleteSkillUseCase;
  let skillRepository: any;

  beforeEach(() => {
    skillRepository = { findById: jest.fn(), delete: jest.fn() };
    useCase = new DeleteSkillUseCase(skillRepository);
  });

  it('should delete an existing skill', async () => {
    skillRepository.findById.mockResolvedValue(new Skill('skill-1', 'Grammar'));
    await useCase.execute('skill-1');
    expect(skillRepository.delete).toHaveBeenCalledWith('skill-1');
  });

  it('should throw NotFoundException when skill not found', async () => {
    skillRepository.findById.mockResolvedValue(null);
    await expect(useCase.execute('non-existent')).rejects.toThrow(NotFoundException);
  });
});
