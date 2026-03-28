import { NotFoundException } from '@nestjs/common';
import { GetSkillByIdUseCase } from './get-skill-by-id.usecase';
import { Skill } from '../../../domain/entities/skill.entity';

describe('GetSkillByIdUseCase', () => {
  let useCase: GetSkillByIdUseCase;
  let skillRepository: any;

  beforeEach(() => {
    skillRepository = { findById: jest.fn() };
    useCase = new GetSkillByIdUseCase(skillRepository);
  });

  it('should return skill DTO when found', async () => {
    skillRepository.findById.mockResolvedValue(new Skill('skill-1', 'Grammar'));
    const result = await useCase.execute('skill-1');
    expect(result.id).toBe('skill-1');
    expect(result.title).toBe('Grammar');
  });

  it('should throw NotFoundException when not found', async () => {
    skillRepository.findById.mockResolvedValue(null);
    await expect(useCase.execute('non-existent')).rejects.toThrow(NotFoundException);
  });
});
