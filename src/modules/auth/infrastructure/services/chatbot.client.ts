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
}
