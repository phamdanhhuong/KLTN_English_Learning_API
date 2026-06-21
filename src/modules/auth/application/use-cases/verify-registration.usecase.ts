import {
  Inject,
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { AUTH_TOKENS } from '../../domain/di/tokens';
import { AuthUserRepository } from '../../domain/repositories/auth-user.repository';
import { TokenService, TokenPair } from '../../domain/services/token.service';
import { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository';
import { UserProfileService } from '../../domain/services/user-profile.service';
import { CacheService } from '../../domain/services/cache.service';
import { CompleteRegistrationDto } from '../dto/complete-registration.dto';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { LearningGoal } from '@prisma/client';
import { QuestService } from '../../../quest/application/services/quest.service';
import { ChatbotClient } from '../../infrastructure/services/chatbot.client';

interface CachedRegistrationData {
  hashedPassword: string;
  fullName?: string;
  profilePictureUrl?: string;
  dateOfBirth?: string;
  gender?: string;
  nativeLanguage?: string;
  targetLanguage?: string;
  proficiencyLevel?: string;
  learningGoals?: string[];
  dailyGoalMinutes?: number;
  timezone?: string;
  studyReminder?: string;
  reminderTime?: string;
}

@Injectable()
export class VerifyRegistrationUseCase {
  private readonly logger = new Logger(VerifyRegistrationUseCase.name);

  constructor(
    @Inject(AUTH_TOKENS.AUTH_USER_REPOSITORY)
    private readonly authUserRepo: AuthUserRepository,
    @Inject(AUTH_TOKENS.TOKEN_SERVICE)
    private readonly tokenService: TokenService,
    @Inject(AUTH_TOKENS.REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepo: RefreshTokenRepository,
    @Inject(AUTH_TOKENS.USER_PROFILE_SERVICE)
    private readonly userProfileService: UserProfileService,
    @Inject(AUTH_TOKENS.CACHE_SERVICE)
    private readonly cacheService: CacheService,
    private readonly prisma: PrismaService,
    private readonly questService: QuestService,
    private readonly chatbotClient: ChatbotClient,
  ) {}

  async execute(
    dto: CompleteRegistrationDto,
  ): Promise<{ user: any; tokens: TokenPair; message: string }> {
    // Mobile sends email as "userId" and otp code as "otp"
    const email = dto.userId;
    const otpCode = dto.otp;

    // Verify OTP
    const isValid = await this.userProfileService.verifyRegistrationOtp(
      email,
      otpCode,
    );
    if (!isValid) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Retrieve cached registration data (saved during register/initiate step)
    const cachedRaw = await this.cacheService.get<string>(`register:${email}`);
    if (!cachedRaw) {
      throw new BadRequestException(
        'Registration session expired. Please register again.',
      );
    }

    const registrationData: CachedRegistrationData =
      typeof cachedRaw === 'string' ? JSON.parse(cachedRaw) : cachedRaw;

    // Check if user already exists (race condition protection)
    const existingUser = await this.authUserRepo.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    // Get default USER role ID
    const defaultRoleId = await this.getDefaultRoleId();

    // Create user with full onboarding data
    const user = await this.authUserRepo.create({
      email,
      password: registrationData.hashedPassword,
      roleId: defaultRoleId,
      isEmailVerified: true,
      fullName: registrationData.fullName,
      profilePictureUrl: registrationData.profilePictureUrl,
      dateOfBirth: registrationData.dateOfBirth
        ? new Date(registrationData.dateOfBirth)
        : undefined,
      gender: registrationData.gender,
      nativeLanguage: registrationData.nativeLanguage,
      targetLanguage: registrationData.targetLanguage,
      proficiencyLevel: registrationData.proficiencyLevel,
      learningGoals: registrationData.learningGoals,
      dailyGoalMinutes: registrationData.dailyGoalMinutes,
      timezone: registrationData.timezone,
    });

    // Clean up cached registration data
    await this.cacheService.del(`register:${email}`);

    // Initialize all user profiles (gamification + league + achievements)
    try {
      await this.userProfileService.createUserProfile(user.id, user.email);
      await this.initializeUserRoadmap(user.id, registrationData);
      await this.questService.checkAndInitQuests(user.id);
    } catch (error) {
      this.logger.warn(
        `Failed to create user profile or roadmap for ${user.id}: ${error.message}`,
      );
    }

    // Generate tokens
    const roleName = user.role?.name || 'USER';
    const tokens = this.generateTokenPair(user.id, user.email, roleName);

    // Save refresh token
    await this.refreshTokenRepo.create({
      token: tokens.refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: registrationData.fullName,
      },
      tokens,
      message: 'Registration successful',
    };
  }

  private generateTokenPair(
    userId: string,
    email: string,
    role: string,
  ): TokenPair {
    const payload = { sub: userId, email, role };
    return {
      accessToken: this.tokenService.generateAccessToken(payload),
      refreshToken: this.tokenService.generateRefreshToken(payload),
    };
  }

  private async getDefaultRoleId(): Promise<string> {
    const cached = await this.cacheService.get<string>('role:USER');
    if (cached) return cached;
    return 'USER';
  }

  private async initializeUserRoadmap(userId: string, registrationData: CachedRegistrationData): Promise<void> {
    try {
      let matchingRoadmap: any = null;

      // Load all active roadmaps (basic info) to send to AI
      const activeRoadmaps = await this.prisma.roadmap.findMany({
        where: { isActive: true },
        select: { id: true, title: true, targetGoal: true },
      });

      // Ask AI to recommend the best roadmap
      if (activeRoadmaps.length > 0) {
        try {
          const aiResult = await this.chatbotClient.recommendRoadmap({
            targetLanguage: registrationData.targetLanguage,
            proficiencyLevel: registrationData.proficiencyLevel,
            learningGoals: registrationData.learningGoals,
            dailyGoalMinutes: registrationData.dailyGoalMinutes,
            existingRoadmaps: activeRoadmaps,
          });

          if (aiResult?.roadmapId) {
            matchingRoadmap = await this.prisma.roadmap.findUnique({
              where: { id: aiResult.roadmapId },
              include: {
                milestones: {
                  orderBy: { order: 'asc' },
                  include: { milestoneSkills: true },
                },
              },
            });
            this.logger.log(`AI recommended roadmap: ${aiResult.roadmapId}`);
          }
        } catch (aiError) {
          this.logger.warn(
            `AI roadmap recommendation failed, falling back to DB match: ${aiError.message}`,
          );
        }
      }

      // Deterministic fallback: match by learning goals
      const learningGoals = registrationData.learningGoals;
      if (!matchingRoadmap && learningGoals && learningGoals.length > 0) {
        matchingRoadmap = await this.prisma.roadmap.findFirst({
          where: {
            targetGoal: { in: learningGoals as LearningGoal[] },
            isActive: true,
          },
          include: {
            milestones: {
              orderBy: { order: 'asc' },
              include: { milestoneSkills: true },
            },
          },
        });
      }

      // Last resort fallback: first active roadmap
      if (!matchingRoadmap) {
        matchingRoadmap = await this.prisma.roadmap.findFirst({
          where: { isActive: true },
          orderBy: { createdAt: 'asc' },
          include: {
            milestones: {
              orderBy: { order: 'asc' },
              include: { milestoneSkills: true },
            },
          },
        });
      }

      if (matchingRoadmap) {
        // Assign the Roadmap to User
        await this.prisma.userRoadmap.create({
          data: {
            userId,
            roadmapId: matchingRoadmap.id,
            status: 'IN_PROGRESS',
          },
        });
        
        this.logger.log(`Assigned Roadmap ${matchingRoadmap.id} to User ${userId}`);

        // Initialize Skill Progress for the first skill of the first milestone
        const firstMilestone = matchingRoadmap.milestones[0];
        if (firstMilestone && firstMilestone.milestoneSkills && firstMilestone.milestoneSkills.length > 0) {
          const firstSkill = firstMilestone.milestoneSkills[0];
          
          await this.prisma.skillProgress.create({
            data: {
              userId,
              skillId: firstSkill.skillId,
              levelReached: 1,
              lessonPosition: 1,
            },
          });
          
          this.logger.log(`Initialized SkillProgress for Skill ${firstSkill.skillId} to User ${userId}`);
        }
      }
    } catch (error) {
      this.logger.warn(`Failed to initialize user roadmap for ${userId}: ${error.message}`);
    }
  }
}
