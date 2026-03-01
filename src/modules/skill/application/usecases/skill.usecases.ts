import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import type { SkillRepository } from '../../domain/repositories/skill.repository.interface';
import type { SkillDomainService } from '../../domain/services/skill-domain.service.interface';
import { CreateSkillDto, UpdateSkillDto, SkillDto } from '../dto/skill.dto';
import { Skill } from '../../domain/entities/skill.entity';
import { SKILL_TOKENS } from '../../domain/di/tokens';

@Injectable()
export class SkillUseCases {
  constructor(
    @Inject(SKILL_TOKENS.SKILL_REPOSITORY)
    private readonly skillRepository: SkillRepository,
    @Inject(SKILL_TOKENS.SKILL_DOMAIN_SERVICE)
    private readonly skillDomainService: SkillDomainService,
  ) {}

  async createSkill(createSkillDto: CreateSkillDto): Promise<SkillDto> {
    const skill = await this.skillDomainService.createSkillWithLevels(
      createSkillDto.title,
      createSkillDto.description,
      createSkillDto.position,
      createSkillDto.partId,
    );
    return this.toResponseDto(skill);
  }

  async getAllSkills(): Promise<SkillDto[]> {
    const skills = await this.skillRepository.findByPosition();
    return skills.map((skill) => this.toResponseDto(skill));
  }

  async getSkillById(id: string): Promise<SkillDto> {
    const skill = await this.skillRepository.findById(id);
    if (!skill) {
      throw new NotFoundException(`Skill with ID ${id} not found`);
    }
    return this.toResponseDto(skill);
  }

  async updateSkill(
    id: string,
    updateSkillDto: UpdateSkillDto,
  ): Promise<SkillDto> {
    const existingSkill = await this.skillRepository.findById(id);
    if (!existingSkill) {
      throw new NotFoundException(`Skill with ID ${id} not found`);
    }

    let updatedSkill = existingSkill;

    if (updateSkillDto.title) {
      updatedSkill = updatedSkill.updateTitle(updateSkillDto.title);
    }
    if (updateSkillDto.description !== undefined) {
      updatedSkill = updatedSkill.updateDescription(updateSkillDto.description);
    }
    if (updateSkillDto.position !== undefined) {
      updatedSkill = updatedSkill.updatePosition(updateSkillDto.position);
    }
    if (updateSkillDto.partId !== undefined) {
      updatedSkill = updatedSkill.updatePartId(updateSkillDto.partId);
    }

    const savedSkill = await this.skillRepository.update(updatedSkill);
    return this.toResponseDto(savedSkill);
  }

  async deleteSkill(id: string): Promise<void> {
    const skill = await this.skillRepository.findById(id);
    if (!skill) {
      throw new NotFoundException(`Skill with ID ${id} not found`);
    }
    await this.skillRepository.delete(id);
  }

  async validateSkillStructure(
    id: string,
  ): Promise<{ isValid: boolean; message: string }> {
    const isValid = await this.skillDomainService.validateSkillStructure(id);
    return {
      isValid,
      message: isValid
        ? 'Skill structure is valid'
        : 'Skill structure is invalid - missing required levels',
    };
  }

  private toResponseDto(skill: Skill): SkillDto {
    return {
      id: skill.id,
      title: skill.title,
      description: skill.description,
      position: skill.position,
      partId: skill.partId,
      createdAt: skill.createdAt,
      updatedAt: skill.updatedAt,
      levels: skill.skillLevels?.map((level) => ({
        skillId: level.skillId,
        level: level.level,
        description: level.getLevelDescription(),
        lessons: level.lessons?.map((lesson) => ({
          id: lesson.id,
          skillId: lesson.skillId,
          skillLevel: lesson.skillLevel,
          title: lesson.title,
          position: lesson.position,
          createdAt: lesson.createdAt,
        })),
      })),
    };
  }
}
