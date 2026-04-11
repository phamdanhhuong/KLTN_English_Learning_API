/*
  Warnings:

  - You are about to drop the `consonant_mastery` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `consonants` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pronunciation_exercise_results` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pronunciation_exercises` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pronunciation_lesson_consonants` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pronunciation_lesson_vowels` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pronunciation_lessons` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `vowel_mastery` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `vowels` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "consonant_mastery" DROP CONSTRAINT "consonant_mastery_consonant_id_fkey";

-- DropForeignKey
ALTER TABLE "pronunciation_exercise_results" DROP CONSTRAINT "pronunciation_exercise_results_exercise_id_fkey";

-- DropForeignKey
ALTER TABLE "pronunciation_exercises" DROP CONSTRAINT "pronunciation_exercises_lesson_id_fkey";

-- DropForeignKey
ALTER TABLE "pronunciation_lesson_consonants" DROP CONSTRAINT "pronunciation_lesson_consonants_consonant_id_fkey";

-- DropForeignKey
ALTER TABLE "pronunciation_lesson_consonants" DROP CONSTRAINT "pronunciation_lesson_consonants_lesson_id_fkey";

-- DropForeignKey
ALTER TABLE "pronunciation_lesson_vowels" DROP CONSTRAINT "pronunciation_lesson_vowels_lesson_id_fkey";

-- DropForeignKey
ALTER TABLE "pronunciation_lesson_vowels" DROP CONSTRAINT "pronunciation_lesson_vowels_vowel_id_fkey";

-- DropForeignKey
ALTER TABLE "vowel_mastery" DROP CONSTRAINT "vowel_mastery_vowel_id_fkey";

-- DropTable
DROP TABLE "consonant_mastery";

-- DropTable
DROP TABLE "consonants";

-- DropTable
DROP TABLE "pronunciation_exercise_results";

-- DropTable
DROP TABLE "pronunciation_exercises";

-- DropTable
DROP TABLE "pronunciation_lesson_consonants";

-- DropTable
DROP TABLE "pronunciation_lesson_vowels";

-- DropTable
DROP TABLE "pronunciation_lessons";

-- DropTable
DROP TABLE "vowel_mastery";

-- DropTable
DROP TABLE "vowels";

-- CreateTable
CREATE TABLE "user_custom_skills" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_custom_skills_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_custom_skills_user_id_key" ON "user_custom_skills"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_custom_skills_skill_id_key" ON "user_custom_skills"("skill_id");

-- AddForeignKey
ALTER TABLE "user_custom_skills" ADD CONSTRAINT "user_custom_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
