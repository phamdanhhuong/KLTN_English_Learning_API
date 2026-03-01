-- CreateEnum
CREATE TYPE "ExerciseType" AS ENUM ('translate', 'listen_choose', 'fill_blank', 'speak', 'match', 'multiple_choice', 'writing_prompt', 'image_description', 'read_comprehension', 'podcast', 'compare_words', 'pronunciation_vowel', 'pronunciation_consonant', 'pronunciation_word');

-- CreateTable
CREATE TABLE "skill_parts" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skill_parts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "part_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_levels" (
    "skill_id" TEXT NOT NULL,
    "level" INTEGER NOT NULL,

    CONSTRAINT "skill_levels_pkey" PRIMARY KEY ("skill_id","level")
);

-- CreateTable
CREATE TABLE "lessons" (
    "id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "skill_level" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "words" (
    "id" TEXT NOT NULL,
    "content" VARCHAR(255) NOT NULL,
    "pronunciation" VARCHAR(255),
    "meaning" TEXT,
    "audio_url" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "words_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grammars" (
    "id" TEXT NOT NULL,
    "rule" TEXT NOT NULL,
    "explanation" TEXT,
    "examples" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grammars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vowels" (
    "id" TEXT NOT NULL,
    "symbol" VARCHAR(10) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "examples" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vowels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consonants" (
    "id" TEXT NOT NULL,
    "symbol" VARCHAR(10) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "examples" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consonants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercises" (
    "id" TEXT NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "exercise_type" "ExerciseType" NOT NULL,
    "prompt" TEXT,
    "meta" JSONB,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pronunciation_lessons" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pronunciation_lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pronunciation_lesson_vowels" (
    "lesson_id" TEXT NOT NULL,
    "vowel_id" TEXT NOT NULL,

    CONSTRAINT "pronunciation_lesson_vowels_pkey" PRIMARY KEY ("lesson_id","vowel_id")
);

-- CreateTable
CREATE TABLE "pronunciation_lesson_consonants" (
    "lesson_id" TEXT NOT NULL,
    "consonant_id" TEXT NOT NULL,

    CONSTRAINT "pronunciation_lesson_consonants_pkey" PRIMARY KEY ("lesson_id","consonant_id")
);

-- CreateTable
CREATE TABLE "pronunciation_exercises" (
    "id" TEXT NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "exercise_type" "ExerciseType" NOT NULL,
    "prompt" TEXT,
    "meta" JSONB,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pronunciation_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pronunciation_exercise_results" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "correct_count" INTEGER NOT NULL DEFAULT 0,
    "incorrect_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pronunciation_exercise_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vowel_mastery" (
    "user_id" TEXT NOT NULL,
    "vowel_id" TEXT NOT NULL,
    "mastery_level" INTEGER NOT NULL DEFAULT 0,
    "last_review" TIMESTAMPTZ(6),

    CONSTRAINT "vowel_mastery_pkey" PRIMARY KEY ("user_id","vowel_id")
);

-- CreateTable
CREATE TABLE "consonant_mastery" (
    "user_id" TEXT NOT NULL,
    "consonant_id" TEXT NOT NULL,
    "mastery_level" INTEGER NOT NULL DEFAULT 0,
    "last_review" TIMESTAMPTZ(6),

    CONSTRAINT "consonant_mastery_pkey" PRIMARY KEY ("user_id","consonant_id")
);

-- CreateTable
CREATE TABLE "skill_progress" (
    "user_id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "level_reached" INTEGER NOT NULL DEFAULT 1,
    "lesson_position" INTEGER NOT NULL DEFAULT 0,
    "last_practiced" TIMESTAMPTZ(6),

    CONSTRAINT "skill_progress_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "word_mastery" (
    "user_id" TEXT NOT NULL,
    "word_id" TEXT NOT NULL,
    "mastery_level" INTEGER NOT NULL DEFAULT 0,
    "last_review" TIMESTAMPTZ(6),

    CONSTRAINT "word_mastery_pkey" PRIMARY KEY ("user_id","word_id")
);

-- CreateTable
CREATE TABLE "grammar_mastery" (
    "user_id" TEXT NOT NULL,
    "grammar_id" TEXT NOT NULL,
    "mastery_level" INTEGER NOT NULL DEFAULT 0,
    "last_review" TIMESTAMPTZ(6),

    CONSTRAINT "grammar_mastery_pkey" PRIMARY KEY ("user_id","grammar_id")
);

-- CreateTable
CREATE TABLE "exercise_results" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "correct_count" INTEGER NOT NULL DEFAULT 0,
    "incorrect_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exercise_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_words" (
    "exercise_id" TEXT NOT NULL,
    "word_id" TEXT NOT NULL,

    CONSTRAINT "exercise_words_pkey" PRIMARY KEY ("exercise_id","word_id")
);

-- CreateTable
CREATE TABLE "exercise_grammars" (
    "exercise_id" TEXT NOT NULL,
    "grammar_id" TEXT NOT NULL,

    CONSTRAINT "exercise_grammars_pkey" PRIMARY KEY ("exercise_id","grammar_id")
);

-- CreateTable
CREATE TABLE "skill_words" (
    "skill_id" TEXT NOT NULL,
    "word_id" TEXT NOT NULL,

    CONSTRAINT "skill_words_pkey" PRIMARY KEY ("skill_id","word_id")
);

-- CreateTable
CREATE TABLE "skill_grammars" (
    "skill_id" TEXT NOT NULL,
    "grammar_id" TEXT NOT NULL,

    CONSTRAINT "skill_grammars_pkey" PRIMARY KEY ("skill_id","grammar_id")
);

-- CreateTable
CREATE TABLE "word_tags" (
    "word_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,

    CONSTRAINT "word_tags_pkey" PRIMARY KEY ("word_id","tag_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "words_content_key" ON "words"("content");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "vowels_symbol_key" ON "vowels"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "consonants_symbol_key" ON "consonants"("symbol");

-- AddForeignKey
ALTER TABLE "skills" ADD CONSTRAINT "skills_part_id_fkey" FOREIGN KEY ("part_id") REFERENCES "skill_parts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_levels" ADD CONSTRAINT "skill_levels_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_skill_id_skill_level_fkey" FOREIGN KEY ("skill_id", "skill_level") REFERENCES "skill_levels"("skill_id", "level") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pronunciation_lesson_vowels" ADD CONSTRAINT "pronunciation_lesson_vowels_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "pronunciation_lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pronunciation_lesson_vowels" ADD CONSTRAINT "pronunciation_lesson_vowels_vowel_id_fkey" FOREIGN KEY ("vowel_id") REFERENCES "vowels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pronunciation_lesson_consonants" ADD CONSTRAINT "pronunciation_lesson_consonants_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "pronunciation_lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pronunciation_lesson_consonants" ADD CONSTRAINT "pronunciation_lesson_consonants_consonant_id_fkey" FOREIGN KEY ("consonant_id") REFERENCES "consonants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pronunciation_exercises" ADD CONSTRAINT "pronunciation_exercises_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "pronunciation_lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pronunciation_exercise_results" ADD CONSTRAINT "pronunciation_exercise_results_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "pronunciation_exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vowel_mastery" ADD CONSTRAINT "vowel_mastery_vowel_id_fkey" FOREIGN KEY ("vowel_id") REFERENCES "vowels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consonant_mastery" ADD CONSTRAINT "consonant_mastery_consonant_id_fkey" FOREIGN KEY ("consonant_id") REFERENCES "consonants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_progress" ADD CONSTRAINT "skill_progress_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "word_mastery" ADD CONSTRAINT "word_mastery_word_id_fkey" FOREIGN KEY ("word_id") REFERENCES "words"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grammar_mastery" ADD CONSTRAINT "grammar_mastery_grammar_id_fkey" FOREIGN KEY ("grammar_id") REFERENCES "grammars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_results" ADD CONSTRAINT "exercise_results_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_words" ADD CONSTRAINT "exercise_words_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_words" ADD CONSTRAINT "exercise_words_word_id_fkey" FOREIGN KEY ("word_id") REFERENCES "words"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_grammars" ADD CONSTRAINT "exercise_grammars_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_grammars" ADD CONSTRAINT "exercise_grammars_grammar_id_fkey" FOREIGN KEY ("grammar_id") REFERENCES "grammars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_words" ADD CONSTRAINT "skill_words_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_words" ADD CONSTRAINT "skill_words_word_id_fkey" FOREIGN KEY ("word_id") REFERENCES "words"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_grammars" ADD CONSTRAINT "skill_grammars_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_grammars" ADD CONSTRAINT "skill_grammars_grammar_id_fkey" FOREIGN KEY ("grammar_id") REFERENCES "grammars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "word_tags" ADD CONSTRAINT "word_tags_word_id_fkey" FOREIGN KEY ("word_id") REFERENCES "words"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "word_tags" ADD CONSTRAINT "word_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
