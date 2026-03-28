import { NotFoundException } from '@nestjs/common';
import { UpdateSkillUseCase } from './update-skill.usecase';
import { Skill } from '../../../domain/entities/skill.entity';

describe('UpdateSkillUseCase', () => {
  let useCase: UpdateSkillUseCase;
  let skillRepository: any;
  const existingSkill = new Skill('skill-1', 'Grammar', 'Old desc', 1, 'part-1');

  beforeEach(() => {
    skillRepository = { findById: jest.fn(), update: jest.fn() };
    useCase = new UpdateSkillUseCase(skillRepository);
  });

  it('should update skill title', async () => {
    skillRepository.findById.mockResolvedValue(existingSkill);
    skillRepository.update.mockImplementation((s: Skill) => Promise.resolve(s));

    const result = await useCase.execute('skill-1', { title: 'New Grammar' });
    expect(result.title).toBe('New Grammar');
  });

  it('should update skill position', async () => {
    skillRepository.findById.mockResolvedValue(existingSkill);
    skillRepository.update.mockImplementation((s: Skill) => Promise.resolve(s));

    const result = await useCase.execute('skill-1', { position: 5 });
    expect(result.position).toBe(5);
  });

  it('should throw NotFoundException when skill not found', async () => {
    skillRepository.findById.mockResolvedValue(null);
    await expect(useCase.execute('non-existent', { title: 'X' })).rejects.toThrow(NotFoundException);
  });
});
