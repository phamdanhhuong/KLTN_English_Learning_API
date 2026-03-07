import {
    Injectable,
    Inject,
    NotFoundException,
    ConflictException,
} from '@nestjs/common';
import { USER_TOKENS } from '../../domain/di/tokens';
import { UserProfileRepository, UpdateUserProfileData } from '../../domain/repositories/user-profile.repository';
import { UserProfile } from '../../domain/entities/user-profile.entity';

export class UpdateProfileDto {
    username?: string;
    fullName?: string;
    profilePictureUrl?: string;
    dateOfBirth?: Date;
    gender?: string;
}

@Injectable()
export class UpdateProfileUseCase {
    constructor(
        @Inject(USER_TOKENS.USER_PROFILE_REPOSITORY)
        private readonly userProfileRepo: UserProfileRepository,
    ) { }

    async execute(userId: string, dto: UpdateProfileDto): Promise<UserProfile> {
        const existing = await this.userProfileRepo.findById(userId);
        if (!existing) {
            throw new NotFoundException('User profile not found');
        }

        // Check username uniqueness if changing
        if (dto.username && dto.username !== existing.username) {
            const taken = await this.userProfileRepo.findByUsername(dto.username);
            if (taken) {
                throw new ConflictException('Username already taken');
            }
        }

        const data: UpdateUserProfileData = {};
        if (dto.username !== undefined) data.username = dto.username;
        if (dto.fullName !== undefined) data.fullName = dto.fullName;
        if (dto.profilePictureUrl !== undefined) data.profilePictureUrl = dto.profilePictureUrl;
        if (dto.dateOfBirth !== undefined) data.dateOfBirth = dto.dateOfBirth;
        if (dto.gender !== undefined) data.gender = dto.gender;

        return this.userProfileRepo.update(userId, data);
    }
}
