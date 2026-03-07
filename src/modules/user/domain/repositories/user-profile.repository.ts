import { UserProfile } from '../entities/user-profile.entity';

export interface UpdateUserProfileData {
    username?: string;
    fullName?: string;
    profilePictureUrl?: string;
    dateOfBirth?: Date;
    gender?: string;
}

export interface UpdateUserPreferencesData {
    nativeLanguage?: string;
    targetLanguage?: string;
    proficiencyLevel?: string;
    learningGoals?: string[];
    dailyGoalMinutes?: number;
    timezone?: string;
}

export interface UserProfileRepository {
    findById(id: string): Promise<UserProfile | null>;
    findByEmail(email: string): Promise<UserProfile | null>;
    findByUsername(username: string): Promise<UserProfile | null>;
    create(userId: string, email: string): Promise<UserProfile>;
    createWithDetails(data: {
        userId: string;
        email: string;
        fullName?: string;
        profilePictureUrl?: string;
        username?: string;
    }): Promise<UserProfile>;
    update(id: string, data: UpdateUserProfileData): Promise<UserProfile>;
    updatePreferences(id: string, data: UpdateUserPreferencesData): Promise<UserProfile>;
}
