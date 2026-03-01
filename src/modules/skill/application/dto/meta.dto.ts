// ================================
// 🌍 1. Translate
// ================================
export interface TranslateMeta {
  sourceText: string;
  correctAnswer: string;
  hints?: string[];
}

// ================================
// 🎧 2. Listen Choose
// ================================
export interface ListenChooseMeta {
  correctAnswer: string;
  options: string[];
  sentence: string;
}

// ================================
// ✏️ 3. Fill Blank
// ================================
export interface FillBlankSentence {
  text: string;
  correctAnswer: string;
  options?: string[];
}

export interface FillBlankMeta {
  sentences: FillBlankSentence[];
  context?: string;
}

// ================================
// 🗣️ 4. Speak
// ================================
export interface SpeakMeta {
  prompt: string;
  expectedText: string;
}

// ================================
// 🔗 5. Match
// ================================
export interface MatchPair {
  left: string;
  right: string;
}

export interface MatchMeta {
  pairs: MatchPair[];
}

// ================================
// ✅ 6. Multiple Choice
// ================================
export interface MultipleChoiceOption {
  text: string;
  order: number;
}

export interface MultipleChoiceMeta {
  question: string;
  options: MultipleChoiceOption[];
  correctOrder: number[];
}

// ================================
// 📝 7. Writing Prompt
// ================================
export interface WritingPromptMeta {
  prompt: string;
  minWords?: number;
  maxWords?: number;
  exampleAnswer?: string;
  criteria?: string[];
}

// ================================
// 🖼️ 8. Image Description
// ================================
export interface ImageDescriptionMeta {
  imageUrl: string;
  prompt: string;
  expectedResults: string;
}

// ================================
// 📻 9. Podcast
// ================================
export interface PodcastQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface MatchPodcastQuestion {
  type: 'match';
  question: string;
  pairs: MatchPair[];
}

export interface TrueFalsePodcastQuestion {
  type: 'trueFalse';
  statement: string;
  correctAnswer: boolean;
  explanation?: string;
}

export interface ListenChoosePodcastQuestion {
  type: 'listenChoose';
  question: string;
  correctWords: string[];
  distractorWords: string[];
}

export interface MultipleChoicePodcastQuestion {
  type: 'multipleChoice';
  question: string;
  options: string[];
  correctAnswer: string;
}

export type EnhancedPodcastQuestion =
  | MatchPodcastQuestion
  | TrueFalsePodcastQuestion
  | ListenChoosePodcastQuestion
  | MultipleChoicePodcastQuestion;

export interface PodcastMediaInfo {
  type: 'gif' | 'video' | 'lottie' | 'none';
  url?: string | null;
  thumbnailUrl?: string | null;
}

export interface PodcastSegment {
  order: number;
  transcript: string;
  voiceGender: 'male' | 'female';
  questions?: EnhancedPodcastQuestion[] | null;
}

export interface PodcastMeta {
  title: string;
  description?: string;
  showTranscript?: boolean;
  media?: PodcastMediaInfo;
  segments: PodcastSegment[];
}

// ================================
// 🔍 10. Compare Words
// ================================
export interface CompareWordsMeta {
  instruction: string;
  word1: string;
  word2: string;
  correctAnswer: boolean;
  explanation?: string;
}

// ================================
// 🧩 Union Type
// ================================
export type ExerciseMeta =
  | TranslateMeta
  | ListenChooseMeta
  | FillBlankMeta
  | SpeakMeta
  | MatchMeta
  | MultipleChoiceMeta
  | WritingPromptMeta
  | ImageDescriptionMeta
  | PodcastMeta
  | CompareWordsMeta;
