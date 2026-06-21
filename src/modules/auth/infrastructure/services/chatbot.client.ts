import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface RecommendRoadmapRequest {
  targetLanguage?: string;
  proficiencyLevel?: string;
  learningGoals?: string[];
  dailyGoalMinutes?: number;
  existingRoadmaps: { id: string; title: string; targetGoal: string }[];
}

export interface RecommendRoadmapResponse {
  roadmapId: string;
}

export interface GenerateRoadmapRequest {
  targetLanguage?: string;
  proficiencyLevel?: string;
  learningGoals?: string[];
  dailyGoalMinutes?: number;
}

export interface GeneratedMilestone {
  title: string;
  targetLevel: string;
  order: number;
}

export interface GenerateRoadmapResponse {
  title: string;
  targetGoal: string;
  description: string;
  milestones: GeneratedMilestone[];
}

export interface GenerateSkillRequest {
  milestoneTitle: string;
  milestoneTargetLevel: string;
  proficiencyLevel?: string;
  learningGoals?: string[];
  skillIndex: number;
}

export interface GeneratedLesson {
  level: number;
  position: number;
  title: string;
}

export interface GenerateSkillResponse {
  title: string;
  description: string;
  lessons: GeneratedLesson[];
}

export interface GenerateExercisesRequest {
  topic: string;
  difficulty: string;
  exercise_count: number;
  allowed_types?: string[];
}

export interface GenerateExercisesResponse {
  exercises: any[];
  topic: string;
  difficulty: string;
}

@Injectable()
export class ChatbotClient {
  private readonly logger = new Logger(ChatbotClient.name);
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl =
      this.configService.get<string>('AI_SERVICE_ENDPOINT') ||
      'http://localhost:3006';
  }

  async recommendRoadmap(
    payload: RecommendRoadmapRequest,
  ): Promise<RecommendRoadmapResponse> {
    const url = `${this.baseUrl}/recommend-roadmap`;
    this.logger.log(`Calling AI roadmap recommendation: ${url}`);
    this.logger.debug(`Payload: ${JSON.stringify(payload)}`);

    const response = await axios.post<RecommendRoadmapResponse>(url, payload, {
      timeout: 15000, // 15s timeout – AI calls can be slow
      headers: { 'Content-Type': 'application/json' },
    });

    this.logger.log(
      `AI recommended roadmapId: ${response.data.roadmapId}`,
    );
    return response.data;
  }

  async generateRoadmap(
    payload: GenerateRoadmapRequest,
  ): Promise<GenerateRoadmapResponse> {
    const url = `${this.baseUrl}/generate-roadmap`;
    this.logger.log(`Calling AI roadmap generation: ${url}`);

    const response = await axios.post<GenerateRoadmapResponse>(url, payload, {
      timeout: 30000, // 30s timeout – generating 10 milestones takes time
      headers: { 'Content-Type': 'application/json' },
    });

    this.logger.log(`AI generated roadmap: ${response.data.title}`);
    return response.data;
  }

  async generateSkill(
    payload: GenerateSkillRequest,
  ): Promise<GenerateSkillResponse> {
    const url = `${this.baseUrl}/generate-skill`;
    this.logger.log(`Calling AI skill generation: ${url}`);

    const response = await axios.post<GenerateSkillResponse>(url, payload, {
      timeout: 30000, // 30s timeout – generating 19 lessons takes time
      headers: { 'Content-Type': 'application/json' },
    });

    this.logger.log(`AI generated skill: ${response.data.title}`);
    return response.data;
  }

  async generateExercises(
    payload: GenerateExercisesRequest,
  ): Promise<GenerateExercisesResponse> {
    const url = `${this.baseUrl}/exercises/generate`;
    this.logger.log(`Calling AI exercise generation: ${url}`);

    const response = await axios.post<GenerateExercisesResponse>(url, payload, {
      timeout: 45000, // 45s timeout – generating exercises takes a long time
      headers: { 'Content-Type': 'application/json' },
    });

    this.logger.log(
      `AI generated ${response.data.exercises.length} exercises`,
    );
    return response.data;
  }
}
