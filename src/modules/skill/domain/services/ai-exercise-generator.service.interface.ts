export interface GeneratedExerciseData {
  exerciseType: string;
  prompt: string;
  meta: Record<string, any>;
}

export interface AiExerciseGeneratorService {
  generateExercises(
    topic: string,
    difficulty: string,
    count: number,
  ): Promise<GeneratedExerciseData[]>;
}
