import { UserCustomSkill } from '../entities/user-custom-skill.entity';

export interface UserCustomSkillRepository {
  findByUserId(userId: string): Promise<UserCustomSkill | null>;
  create(userCustomSkill: UserCustomSkill): Promise<UserCustomSkill>;
}
