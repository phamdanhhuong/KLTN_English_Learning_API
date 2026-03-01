import type { ExerciseMeta } from '../../application/dto/meta.dto';

export enum ExerciseType {
  TRANSLATE = 'translate',
  LISTEN_CHOOSE = 'listen_choose',
  FILL_BLANK = 'fill_blank',
  SPEAK = 'speak',
  MATCH = 'match',
  MULTIPLE_CHOICE = 'multiple_choice',
  WRITING_PROMPT = 'writing_prompt',
  IMAGE_DESCRIPTION = 'image_description',
  READ_COMPREHENSION = 'read_comprehension',
  PODCAST = 'podcast',
  COMPARE_WORDS = 'compare_words',
  PRONUNCIATION_VOWEL = 'pronunciation_vowel',
  PRONUNCIATION_CONSONANT = 'pronunciation_consonant',
  PRONUNCIATION_WORD = 'pronunciation_word',
}

export class Exercise {
  constructor(
    public readonly id: string,
    public readonly lessonId: string,
    public readonly exerciseType: ExerciseType,
    public readonly prompt?: string,
    public readonly meta?: ExerciseMeta,
    public readonly position: number = 0,
    public readonly createdAt: Date = new Date(),
  ) {}

  static create(
    lessonId: string,
    exerciseType: ExerciseType,
    prompt?: string,
    meta?: ExerciseMeta,
    position?: number,
  ): Exercise {
    const id = crypto.randomUUID();
    return new Exercise(id, lessonId, exerciseType, prompt, meta, position);
  }

  updatePrompt(newPrompt: string): Exercise {
    return new Exercise(
      this.id,
      this.lessonId,
      this.exerciseType,
      newPrompt,
      this.meta,
      this.position,
      this.createdAt,
    );
  }

  updateMeta(newMeta: ExerciseMeta): Exercise {
    return new Exercise(
      this.id,
      this.lessonId,
      this.exerciseType,
      this.prompt,
      newMeta,
      this.position,
      this.createdAt,
    );
  }

  updatePosition(newPosition: number): Exercise {
    return new Exercise(
      this.id,
      this.lessonId,
      this.exerciseType,
      this.prompt,
      this.meta,
      newPosition,
      this.createdAt,
    );
  }

  isInteractive(): boolean {
    return [
      ExerciseType.MULTIPLE_CHOICE,
      ExerciseType.LISTEN_CHOOSE,
      ExerciseType.FILL_BLANK,
      ExerciseType.MATCH,
      ExerciseType.TRANSLATE,
      ExerciseType.COMPARE_WORDS,
    ].includes(this.exerciseType);
  }

  isContentBased(): boolean {
    return [
      ExerciseType.PODCAST,
      ExerciseType.READ_COMPREHENSION,
      ExerciseType.IMAGE_DESCRIPTION,
    ].includes(this.exerciseType);
  }
}
