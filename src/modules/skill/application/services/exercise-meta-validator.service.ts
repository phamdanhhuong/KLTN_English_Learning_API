import { Injectable } from '@nestjs/common';
import { ExerciseType } from '../../domain/entities/exercise.entity';
import type {
  ExerciseMeta,
  TranslateMeta,
  ListenChooseMeta,
  FillBlankMeta,
  SpeakMeta,
  MatchMeta,
  MultipleChoiceMeta,
  WritingPromptMeta,
  ImageDescriptionMeta,
  PodcastMeta,
  CompareWordsMeta,
} from '../dto/meta.dto';

@Injectable()
export class ExerciseMetaValidatorService {
  validateMeta(exerciseType: ExerciseType, meta?: ExerciseMeta): boolean {
    if (!meta) return true;

    switch (exerciseType) {
      case ExerciseType.TRANSLATE:
        return this.validateTranslateMeta(meta as TranslateMeta);
      case ExerciseType.LISTEN_CHOOSE:
        return this.validateListenChooseMeta(meta as ListenChooseMeta);
      case ExerciseType.FILL_BLANK:
        return this.validateFillBlankMeta(meta as FillBlankMeta);
      case ExerciseType.SPEAK:
        return this.validateSpeakMeta(meta as SpeakMeta);
      case ExerciseType.MATCH:
        return this.validateMatchMeta(meta as MatchMeta);
      case ExerciseType.MULTIPLE_CHOICE:
        return this.validateMultipleChoiceMeta(meta as MultipleChoiceMeta);
      case ExerciseType.WRITING_PROMPT:
        return this.validateWritingPromptMeta(meta as WritingPromptMeta);
      case ExerciseType.IMAGE_DESCRIPTION:
        return this.validateImageDescriptionMeta(meta as ImageDescriptionMeta);
      case ExerciseType.PODCAST:
        return this.validatePodcastMeta(meta as PodcastMeta);
      case ExerciseType.COMPARE_WORDS:
        return this.validateCompareWordsMeta(meta as CompareWordsMeta);
      case ExerciseType.READ_COMPREHENSION:
      case ExerciseType.PRONUNCIATION_VOWEL:
      case ExerciseType.PRONUNCIATION_CONSONANT:
      case ExerciseType.PRONUNCIATION_WORD:
        return true;
      default:
        return false;
    }
  }

  getMetaValidationErrors(
    exerciseType: ExerciseType,
    meta?: ExerciseMeta,
  ): string[] {
    const errors: string[] = [];
    if (!meta) return errors;

    switch (exerciseType) {
      case ExerciseType.TRANSLATE: {
        const m = meta as TranslateMeta;
        if (!m.sourceText) errors.push('sourceText is required');
        if (!m.correctAnswer) errors.push('correctAnswer is required');
        break;
      }
      case ExerciseType.LISTEN_CHOOSE: {
        const m = meta as ListenChooseMeta;
        if (!m.correctAnswer) errors.push('correctAnswer is required');
        if (!m.sentence) errors.push('sentence is required');
        if (!m.options || !Array.isArray(m.options) || m.options.length === 0) {
          errors.push('options array is required and must not be empty');
        }
        break;
      }
      case ExerciseType.FILL_BLANK: {
        const m = meta as FillBlankMeta;
        if (
          !m.sentences ||
          !Array.isArray(m.sentences) ||
          m.sentences.length === 0
        ) {
          errors.push('sentences array is required and must not be empty');
        } else {
          m.sentences.forEach((sentence, index) => {
            if (!sentence.text)
              errors.push(`sentences[${index}].text is required`);
            if (!sentence.correctAnswer)
              errors.push(`sentences[${index}].correctAnswer is required`);
          });
        }
        break;
      }
      case ExerciseType.SPEAK: {
        const m = meta as SpeakMeta;
        if (!m.prompt) errors.push('prompt is required');
        if (!m.expectedText) errors.push('expectedText is required');
        break;
      }
      case ExerciseType.MATCH: {
        const m = meta as MatchMeta;
        if (!m.pairs || !Array.isArray(m.pairs) || m.pairs.length === 0) {
          errors.push('pairs array is required and must not be empty');
        } else {
          m.pairs.forEach((pair, index) => {
            if (!pair.left) errors.push(`pairs[${index}].left is required`);
            if (!pair.right) errors.push(`pairs[${index}].right is required`);
          });
        }
        break;
      }
      case ExerciseType.MULTIPLE_CHOICE: {
        const m = meta as MultipleChoiceMeta;
        if (!m.question) errors.push('question is required');
        if (!m.options || !Array.isArray(m.options) || m.options.length === 0) {
          errors.push('options array is required and must not be empty');
        }
        if (!m.correctOrder || !Array.isArray(m.correctOrder)) {
          errors.push('correctOrder array is required');
        }
        break;
      }
      case ExerciseType.WRITING_PROMPT: {
        const m = meta as WritingPromptMeta;
        if (!m.prompt) errors.push('prompt is required');
        break;
      }
      case ExerciseType.IMAGE_DESCRIPTION: {
        const m = meta as ImageDescriptionMeta;
        if (!m.imageUrl) errors.push('imageUrl is required');
        if (!m.prompt) errors.push('prompt is required');
        if (!m.expectedResults) errors.push('expectedResults is required');
        break;
      }
      case ExerciseType.PODCAST: {
        const m = meta as PodcastMeta;
        if (!m.title) errors.push('title is required');
        if (
          !m.segments ||
          !Array.isArray(m.segments) ||
          m.segments.length === 0
        ) {
          errors.push('segments array is required and must not be empty');
        } else {
          m.segments.forEach((segment, index) => {
            if (typeof segment.order !== 'number')
              errors.push(`segments[${index}].order must be a number`);
            if (!segment.transcript)
              errors.push(`segments[${index}].transcript is required`);
            if (
              segment.voiceGender !== 'male' &&
              segment.voiceGender !== 'female'
            )
              errors.push(
                `segments[${index}].voiceGender must be 'male' or 'female'`,
              );

            if (segment.questions && Array.isArray(segment.questions)) {
              segment.questions.forEach((question: any, qIndex) => {
                if (!question.type) {
                  errors.push(
                    `segments[${index}].questions[${qIndex}].type is required`,
                  );
                } else {
                  switch (question.type) {
                    case 'match':
                      if (!question.question)
                        errors.push(
                          `segments[${index}].questions[${qIndex}].question is required`,
                        );
                      if (
                        !Array.isArray(question.pairs) ||
                        question.pairs.length === 0
                      )
                        errors.push(
                          `segments[${index}].questions[${qIndex}].pairs array is required`,
                        );
                      break;
                    case 'trueFalse':
                      if (!question.statement)
                        errors.push(
                          `segments[${index}].questions[${qIndex}].statement is required`,
                        );
                      if (typeof question.correctAnswer !== 'boolean')
                        errors.push(
                          `segments[${index}].questions[${qIndex}].correctAnswer must be boolean`,
                        );
                      break;
                    case 'listenChoose':
                      if (!question.question)
                        errors.push(
                          `segments[${index}].questions[${qIndex}].question is required`,
                        );
                      if (!Array.isArray(question.correctWords))
                        errors.push(
                          `segments[${index}].questions[${qIndex}].correctWords array is required`,
                        );
                      if (!Array.isArray(question.distractorWords))
                        errors.push(
                          `segments[${index}].questions[${qIndex}].distractorWords array is required`,
                        );
                      break;
                    case 'multipleChoice':
                      if (!question.question)
                        errors.push(
                          `segments[${index}].questions[${qIndex}].question is required`,
                        );
                      if (
                        !Array.isArray(question.options) ||
                        question.options.length === 0
                      )
                        errors.push(
                          `segments[${index}].questions[${qIndex}].options array is required`,
                        );
                      if (!question.correctAnswer)
                        errors.push(
                          `segments[${index}].questions[${qIndex}].correctAnswer is required`,
                        );
                      break;
                    default:
                      errors.push(
                        `segments[${index}].questions[${qIndex}].type '${question.type}' is not supported`,
                      );
                  }
                }
              });
            }
          });
        }
        break;
      }
      case ExerciseType.COMPARE_WORDS: {
        const m = meta as CompareWordsMeta;
        if (!m.instruction) errors.push('instruction is required');
        if (!m.word1) errors.push('word1 is required');
        if (!m.word2) errors.push('word2 is required');
        if (typeof m.correctAnswer !== 'boolean')
          errors.push('correctAnswer must be a boolean');
        break;
      }
    }

    return errors;
  }

  private validateTranslateMeta(meta: TranslateMeta): boolean {
    return !!(meta.sourceText && meta.correctAnswer);
  }

  private validateListenChooseMeta(meta: ListenChooseMeta): boolean {
    return !!(
      meta.correctAnswer &&
      meta.options &&
      Array.isArray(meta.options) &&
      meta.options.length > 0 &&
      meta.sentence
    );
  }

  private validateFillBlankMeta(meta: FillBlankMeta): boolean {
    return !!(
      meta.sentences &&
      Array.isArray(meta.sentences) &&
      meta.sentences.length > 0 &&
      meta.sentences.every((s) => s.text && s.correctAnswer)
    );
  }

  private validateSpeakMeta(meta: SpeakMeta): boolean {
    return !!(meta.prompt && meta.expectedText);
  }

  private validateMatchMeta(meta: MatchMeta): boolean {
    return !!(
      meta.pairs &&
      Array.isArray(meta.pairs) &&
      meta.pairs.length > 0 &&
      meta.pairs.every((p) => p.left && p.right)
    );
  }

  private validateMultipleChoiceMeta(meta: MultipleChoiceMeta): boolean {
    return !!(
      meta.question &&
      meta.options &&
      Array.isArray(meta.options) &&
      meta.options.length > 0 &&
      meta.correctOrder &&
      Array.isArray(meta.correctOrder)
    );
  }

  private validateWritingPromptMeta(meta: WritingPromptMeta): boolean {
    return !!meta.prompt;
  }

  private validateImageDescriptionMeta(meta: ImageDescriptionMeta): boolean {
    return !!(meta.imageUrl && meta.prompt && meta.expectedResults);
  }

  private validatePodcastMeta(meta: PodcastMeta): boolean {
    return !!(
      meta.title &&
      meta.segments &&
      Array.isArray(meta.segments) &&
      meta.segments.length > 0 &&
      meta.segments.every(
        (s) =>
          typeof s.order === 'number' &&
          s.transcript &&
          (s.voiceGender === 'male' || s.voiceGender === 'female'),
      )
    );
  }

  private validateCompareWordsMeta(meta: CompareWordsMeta): boolean {
    return !!(
      meta.instruction &&
      meta.word1 &&
      meta.word2 &&
      typeof meta.correctAnswer === 'boolean'
    );
  }
}
