/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "ProficiencyLevel" AS ENUM ('BEGINNER', 'ELEMENTARY', 'INTERMEDIATE', 'UPPER_INTERMEDIATE', 'ADVANCED', 'PROFICIENT');

-- CreateEnum
CREATE TYPE "LearningGoal" AS ENUM ('CONNECT', 'TRAVEL', 'STUDY', 'ENTERTAINMENT', 'CAREER', 'HOBBY');

-- CreateEnum
CREATE TYPE "CurrencyType" AS ENUM ('GEMS', 'COINS');

-- CreateEnum
CREATE TYPE "CurrencyTransactionReason" AS ENUM ('LESSON_COMPLETED', 'STREAK_MILESTONE', 'ACHIEVEMENT_REWARD', 'QUEST_REWARD', 'PURCHASE', 'LEVEL_UP_REWARD', 'ADMIN_ADJUSTMENT', 'REFUND');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "current_level" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "daily_goal_minutes" INTEGER NOT NULL DEFAULT 15,
ADD COLUMN     "date_of_birth" TIMESTAMP(3),
ADD COLUMN     "full_name" TEXT,
ADD COLUMN     "gender" "Gender",
ADD COLUMN     "learningGoals" "LearningGoal"[],
ADD COLUMN     "native_language" TEXT DEFAULT 'vi',
ADD COLUMN     "proficiency_level" "ProficiencyLevel",
ADD COLUMN     "profile_picture_url" TEXT,
ADD COLUMN     "target_language" TEXT DEFAULT 'en',
ADD COLUMN     "timezone" TEXT DEFAULT 'Asia/Ho_Chi_Minh',
ADD COLUMN     "total_xp_earned" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "username" TEXT,
ADD COLUMN     "xp_points" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "user_currency" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "gems" INTEGER NOT NULL DEFAULT 0,
    "coins" INTEGER NOT NULL DEFAULT 100,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_currency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "currency_transactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "currency_type" "CurrencyType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" "CurrencyTransactionReason" NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "currency_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "streak_data" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "current_streak" INTEGER NOT NULL DEFAULT 0,
    "longest_streak" INTEGER NOT NULL DEFAULT 0,
    "last_study_date" DATE,
    "freeze_count" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "streak_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "streak_history" (
    "id" TEXT NOT NULL,
    "streak_data_id" TEXT NOT NULL,
    "streak_length" INTEGER NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "end_reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "streak_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_daily_activities" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "activity_date" DATE NOT NULL,
    "xp_earned" INTEGER NOT NULL DEFAULT 0,
    "lessons_count" INTEGER NOT NULL DEFAULT 0,
    "exercise_count" INTEGER NOT NULL DEFAULT 0,
    "streak_count" INTEGER NOT NULL DEFAULT 0,
    "freeze_used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_daily_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_energy" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "current_energy" INTEGER NOT NULL DEFAULT 5,
    "max_energy" INTEGER NOT NULL DEFAULT 5,
    "last_recharge_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recharge_rate_min" INTEGER NOT NULL DEFAULT 30,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_energy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_levels" (
    "level" INTEGER NOT NULL,
    "min_xp" INTEGER NOT NULL,
    "max_xp" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "icon_url" TEXT,
    "reward_gems" INTEGER NOT NULL DEFAULT 0,
    "reward_coins" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "user_levels_pkey" PRIMARY KEY ("level")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_currency_user_id_key" ON "user_currency"("user_id");

-- CreateIndex
CREATE INDEX "currency_transactions_user_id_created_at_idx" ON "currency_transactions"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "streak_data_user_id_key" ON "streak_data"("user_id");

-- CreateIndex
CREATE INDEX "streak_history_streak_data_id_idx" ON "streak_history"("streak_data_id");

-- CreateIndex
CREATE INDEX "user_daily_activities_user_id_activity_date_idx" ON "user_daily_activities"("user_id", "activity_date");

-- CreateIndex
CREATE UNIQUE INDEX "user_daily_activities_user_id_activity_date_key" ON "user_daily_activities"("user_id", "activity_date");

-- CreateIndex
CREATE UNIQUE INDEX "user_energy_user_id_key" ON "user_energy"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- AddForeignKey
ALTER TABLE "user_currency" ADD CONSTRAINT "user_currency_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "currency_transactions" ADD CONSTRAINT "currency_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "streak_data" ADD CONSTRAINT "streak_data_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "streak_history" ADD CONSTRAINT "streak_history_streak_data_id_fkey" FOREIGN KEY ("streak_data_id") REFERENCES "streak_data"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_daily_activities" ADD CONSTRAINT "user_daily_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_energy" ADD CONSTRAINT "user_energy_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
