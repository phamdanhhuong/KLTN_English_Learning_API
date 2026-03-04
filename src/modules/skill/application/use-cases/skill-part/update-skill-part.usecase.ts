import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { SkillPartRepository } from '../../../domain/repositories/skill-part.repository.interface';
import { SKILL_TOKENS } from '../../../domain/di/tokens';
import { SkillPart } from '../../../domain/entities/skill-part.entity';
import { UpdateSkillPartDto } from '../../dto/skill.dto';

@Injectable()
export class UpdateSkillPartUseCase {
  constructor(
    @Inject(SKILL_TOKENS.SKILL_PART_REPOSITORY)
    private readonly skillPartRepository: SkillPartRepository,
  ) {}

  async execute(id: string, dto: UpdateSkillPartDto): Promise<SkillPart> {
    const existingSkillPart = await this.skillPartRepository.findById(id);
    if (!existingSkillPart) {
      throw new NotFoundException(`Skill part with ID ${id} not found`);
    }

    let updatedSkillPart = existingSkillPart;

    if (dto.name) {
      updatedSkillPart = updatedSkillPart.updateName(dto.name);
    }
    if (dto.description !== undefined) {
      updatedSkillPart = updatedSkillPart.updateDescription(dto.description);
    }
    if (dto.position !== undefined) {
      updatedSkillPart = updatedSkillPart.updatePosition(dto.position);
    }

    return this.skillPartRepository.update(updatedSkillPart);
  }
}
