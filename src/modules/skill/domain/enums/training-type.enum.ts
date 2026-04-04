import { ExerciseType } from '../entities/exercise.entity';

export enum TrainingType {
  VOCABULARY = 'vocabulary',
  GRAMMAR = 'grammar',
  LISTEN = 'listen',
  SPEAK = 'speak',
  WRITING = 'writing',
}

/**
 * Maps a TrainingType to the relevant ExerciseTypes
 */
export const TRAINING_TYPE_EXERCISE_MAP: Record<TrainingType, ExerciseType[]> = {
  [TrainingType.VOCABULARY]: [
    ExerciseType.MULTIPLE_CHOICE,
    ExerciseType.FILL_BLANK,
    ExerciseType.MATCH,
    ExerciseType.TRANSLATE,
    ExerciseType.COMPARE_WORDS,
  ],
  [TrainingType.GRAMMAR]: [
    ExerciseType.FILL_BLANK,
    ExerciseType.TRANSLATE,
    ExerciseType.WRITING_PROMPT,
    ExerciseType.READ_COMPREHENSION,
  ],
  [TrainingType.LISTEN]: [
    ExerciseType.LISTEN_CHOOSE,
    ExerciseType.PODCAST,
    ExerciseType.PRONUNCIATION_VOWEL,
    ExerciseType.PRONUNCIATION_CONSONANT,
    ExerciseType.PRONUNCIATION_WORD,
  ],
  [TrainingType.SPEAK]: [
    ExerciseType.SPEAK,
    ExerciseType.PRONUNCIATION_VOWEL,
    ExerciseType.PRONUNCIATION_CONSONANT,
    ExerciseType.PRONUNCIATION_WORD,
  ],
  [TrainingType.WRITING]: [
    ExerciseType.WRITING_PROMPT,
    ExerciseType.TRANSLATE,
    ExerciseType.FILL_BLANK,
    ExerciseType.IMAGE_DESCRIPTION,
  ],
};
