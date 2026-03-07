import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import {
    UserProfileRepository,
    UpdateUserProfileData,
    UpdateUserPreferencesData,
} from '../../domain/repositories/user-profile.repository';
import { UserProfile } from '../../domain/entities/user-profile.entity';

@Injectable()
export class PrismaUserProfileRepository implements UserProfileRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findById(id: string): Promise<UserProfile | null> {
        const user = await this.prisma.user.findUnique({ where: { id } });
        return user ? this.toEntity(user) : null;
    }

    async findByEmail(email: string): Promise<UserProfile | null> {
        const user = await this.prisma.user.findUnique({ where: { email } });
        return user ? this.toEntity(user) : null;
    }

    async findByUsername(username: string): Promise<UserProfile | null> {
        const user = await this.prisma.user.findUnique({ where: { username } });
        return user ? this.toEntity(user) : null;
    }

    async create(userId: string, email: string): Promise<UserProfile> {
        // Create gamification records atomically
        const user = await this.prisma.$transaction(async (tx) => {
            await tx.userCurrency.create({ data: { userId } });
            await tx.streakData.create({ data: { userId } });
            await tx.userEnergy.create({ data: { userId } });
            return tx.user.findUniqueOrThrow({ where: { id: userId } });
        });
        return this.toEntity(user);
    }

    async createWithDetails(data: {
        userId: string;
        email: string;
        fullName?: string;
        profilePictureUrl?: string;
        username?: string;
    }): Promise<UserProfile> {
        const user = await this.prisma.$transaction(async (tx) => {
            // Init gamification data
            await tx.userCurrency.create({ data: { userId: data.userId } });
            await tx.streakData.create({ data: { userId: data.userId } });
            await tx.userEnergy.create({ data: { userId: data.userId } });

            // Update user profile with details
            return tx.user.update({
                where: { id: data.userId },
                data: {
                    fullName: data.fullName,
                    profilePictureUrl: data.profilePictureUrl,
                    username: data.username,
                },
            });
        });
        return this.toEntity(user);
    }

    async update(id: string, data: UpdateUserProfileData): Promise<UserProfile> {
        const user = await this.prisma.user.update({
            where: { id },
            data: {
                username: data.username,
                fullName: data.fullName,
                profilePictureUrl: data.profilePictureUrl,
                dateOfBirth: data.dateOfBirth,
                gender: data.gender as any,
            },
        });
        return this.toEntity(user);
    }

    async updatePreferences(id: string, data: UpdateUserPreferencesData): Promise<UserProfile> {
        const user = await this.prisma.user.update({
            where: { id },
            data: {
                nativeLanguage: data.nativeLanguage,
                targetLanguage: data.targetLanguage,
                proficiencyLevel: data.proficiencyLevel as any,
                learningGoals: data.learningGoals as any,
                dailyGoalMinutes: data.dailyGoalMinutes,
                timezone: data.timezone,
            },
        });
        return this.toEntity(user);
    }

    private toEntity(user: any): UserProfile {
        return new UserProfile({
            id: user.id,
            email: user.email,
            username: user.username ?? null,
            fullName: user.fullName ?? null,
            profilePictureUrl: user.profilePictureUrl ?? null,
            dateOfBirth: user.dateOfBirth ?? null,
            gender: user.gender ?? null,
            nativeLanguage: user.nativeLanguage ?? 'vi',
            targetLanguage: user.targetLanguage ?? 'en',
            proficiencyLevel: user.proficiencyLevel ?? null,
            learningGoals: user.learningGoals ?? [],
            dailyGoalMinutes: user.dailyGoalMinutes ?? 15,
            timezone: user.timezone ?? 'Asia/Ho_Chi_Minh',
            xpPoints: user.xpPoints ?? 0,
            currentLevel: user.currentLevel ?? 1,
            totalXpEarned: user.totalXpEarned ?? 0,
            isEmailVerified: user.isEmailVerified,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        });
    }
}
