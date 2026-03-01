import { Injectable, Inject } from '@nestjs/common';
import type { SkillPartRepository } from '../../domain/repositories/skill-part.repository.interface';
import { CreateSkillPartDto, UpdateSkillPartDto } from '../dto/skill.dto';
import { SkillPart } from '../../domain/entities/skill-part.entity';
import { SKILL_TOKENS } from '../../domain/di/tokens';

@Injectable()
export class SkillPartUseCases {
  constructor(
    @Inject(SKILL_TOKENS.SKILL_PART_REPOSITORY)
    private readonly skillPartRepository: SkillPartRepository,
  ) {}

  async getAllSkillParts() {
    return await this.skillPartRepository.findAll();
  }

  async getSkillPartById(id: string) {
    return await this.skillPartRepository.findById(id);
  }

  async createSkillPart(createSkillPartDto: CreateSkillPartDto) {
    const skillPart = SkillPart.create(
      createSkillPartDto.name,
      createSkillPartDto.description,
      createSkillPartDto.position,
    );
    return await this.skillPartRepository.create(skillPart);
  }

  async updateSkillPart(id: string, updateSkillPartDto: UpdateSkillPartDto) {
    const existingSkillPart = await this.skillPartRepository.findById(id);
    if (!existingSkillPart) {
      throw new Error('Skill part not found');
    }

    let updatedSkillPart = existingSkillPart;

    if (updateSkillPartDto.name) {
      updatedSkillPart = updatedSkillPart.updateName(updateSkillPartDto.name);
    }
    if (updateSkillPartDto.description !== undefined) {
      updatedSkillPart = updatedSkillPart.updateDescription(
        updateSkillPartDto.description,
      );
    }
    if (updateSkillPartDto.position !== undefined) {
      updatedSkillPart = updatedSkillPart.updatePosition(
        updateSkillPartDto.position,
      );
    }

    return await this.skillPartRepository.update(updatedSkillPart);
  }

  async deleteSkillPart(id: string) {
    const skillPart = await this.skillPartRepository.findById(id);
    if (!skillPart) {
      throw new Error('Skill part not found');
    }
    await this.skillPartRepository.delete(id);
  }
}
