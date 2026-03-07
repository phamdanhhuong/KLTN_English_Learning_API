export class UserProfile {
    id: string;
    email: string;
    username: string | null;
    fullName: string | null;
    profilePictureUrl: string | null;
    dateOfBirth: Date | null;
    gender: string | null;

    // Learning preferences
    nativeLanguage: string;
    targetLanguage: string;
    proficiencyLevel: string | null;
    learningGoals: string[];
    dailyGoalMinutes: number;
    timezone: string;

    // Gamification
    xpPoints: number;
    currentLevel: number;
    totalXpEarned: number;

    isEmailVerified: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;

    constructor(data: Partial<UserProfile>) {
        Object.assign(this, data);
    }
}
