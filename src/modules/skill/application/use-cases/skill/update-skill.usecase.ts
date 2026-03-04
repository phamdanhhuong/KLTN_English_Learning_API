import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { SkillRepository } from '../../../domain/repositories/skill.repository.interface';
import { SKILL_TOKENS } from '../../../domain/di/tokens';
import { UpdateSkillDto, SkillDto } from '../../dto/skill.dto';
import { SkillMapper } from '../../mappers/skill.mapper';

@Injectable()
export class UpdateSkillUseCase {
  constructor(
    @Inject(SKILL_TOKENS.SKILL_REPOSITORY)
    private readonly skillRepository: SkillRepository,
  ) {}

  async execute(id: string, dto: UpdateSkillDto): Promise<SkillDto> {
    const existingSkill = await this.skillRepository.findById(id);
    if (!existingSkill) {
      throw new NotFoundException(`Skill with ID ${id} not found`);
    }

    let updatedSkill = existingSkill;

    if (dto.title) {
      updatedSkill = updatedSkill.updateTitle(dto.title);
    }
    if (dto.description !== undefined) {
      updatedSkill = updatedSkill.updateDescription(dto.description);
    }
    if (dto.position !== undefined) {
      updatedSkill = updatedSkill.updatePosition(dto.position);
    }
    if (dto.partId !== undefined) {
      updatedSkill = updatedSkill.updatePartId(dto.partId);
    }

    const savedSkill = await this.skillRepository.update(updatedSkill);
    return SkillMapper.toDto(savedSkill);
  }
}
