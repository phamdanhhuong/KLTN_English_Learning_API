import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { USER_TOKENS } from '../../domain/di/tokens';
import { UserProfileRepository } from '../../domain/repositories/user-profile.repository';
import { UserProfile } from '../../domain/entities/user-profile.entity';

@Injectable()
export class GetProfileUseCase {
    constructor(
        @Inject(USER_TOKENS.USER_PROFILE_REPOSITORY)
        private readonly userProfileRepo: UserProfileRepository,
    ) { }

    async execute(userId: string): Promise<UserProfile> {
        const profile = await this.userProfileRepo.findById(userId);
        if (!profile) {
            throw new NotFoundException('User profile not found');
        }
        return profile;
    }
}
