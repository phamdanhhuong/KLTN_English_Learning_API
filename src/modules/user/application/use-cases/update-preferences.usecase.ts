import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { USER_TOKENS } from '../../domain/di/tokens';
import {
    UserProfileRepository,
    UpdateUserPreferencesData,
} from '../../domain/repositories/user-profile.repository';
import { UserProfile } from '../../domain/entities/user-profile.entity';

export class UpdatePreferencesDto {
    nativeLanguage?: string;
    targetLanguage?: string;
    proficiencyLevel?: string;
    learningGoals?: string[];
    dailyGoalMinutes?: number;
    timezone?: string;
}

@Injectable()
export class UpdatePreferencesUseCase {
    constructor(
        @Inject(USER_TOKENS.USER_PROFILE_REPOSITORY)
        private readonly userProfileRepo: UserProfileRepository,
    ) { }

    async execute(userId: string, dto: UpdatePreferencesDto): Promise<UserProfile> {
        const existing = await this.userProfileRepo.findById(userId);
        if (!existing) {
            throw new NotFoundException('User profile not found');
        }

        const data: UpdateUserPreferencesData = {};
        if (dto.nativeLanguage !== undefined) data.nativeLanguage = dto.nativeLanguage;
        if (dto.targetLanguage !== undefined) data.targetLanguage = dto.targetLanguage;
        if (dto.proficiencyLevel !== undefined) data.proficiencyLevel = dto.proficiencyLevel;
        if (dto.learningGoals !== undefined) data.learningGoals = dto.learningGoals;
        if (dto.dailyGoalMinutes !== undefined) data.dailyGoalMinutes = dto.dailyGoalMinutes;
        if (dto.timezone !== undefined) data.timezone = dto.timezone;

        return this.userProfileRepo.updatePreferences(userId, data);
    }
}
