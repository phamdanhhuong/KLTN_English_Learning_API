-- CreateEnum
CREATE TYPE "QuestType" AS ENUM ('DAILY', 'FRIENDS', 'MONTHLY_BADGE');

-- CreateEnum
CREATE TYPE "QuestCategory" AS ENUM ('LESSONS', 'EXERCISES', 'XP_EARNED', 'FRIENDS_CHALLENGE', 'COLLECTION', 'STREAK');

-- CreateEnum
CREATE TYPE "QuestStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CLAIMED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "DifficultyLevel" AS ENUM ('EASY', 'NORMAL', 'HARD', 'EXPERT');

-- CreateEnum
CREATE TYPE "ChestType" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'LEGENDARY');

-- CreateEnum
CREATE TYPE "ChestStatus" AS ENUM ('LOCKED', 'UNLOCKED', 'OPENED');

-- CreateEnum
CREATE TYPE "LeagueTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'SAPPHIRE', 'RUBY', 'EMERALD', 'AMETHYST', 'PEARL', 'OBSIDIAN', 'DIAMOND');

-- CreateEnum
CREATE TYPE "LeagueStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('SPAM', 'HARASSMENT', 'INAPPROPRIATE_CONTENT', 'FAKE_ACCOUNT', 'OTHER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED');

-- CreateTable
CREATE TABLE "user_relationships" (
    "id" TEXT NOT NULL,
    "follower_id" TEXT NOT NULL,
    "following_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_blocks" (
    "id" TEXT NOT NULL,
    "blocker_id" TEXT NOT NULL,
    "blocked_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_reports" (
    "id" TEXT NOT NULL,
    "reporter_id" TEXT NOT NULL,
    "reported_user_id" TEXT NOT NULL,
    "reason" "ReportReason" NOT NULL,
    "description" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon_url" TEXT,
    "badge_url" TEXT,
    "category" TEXT NOT NULL,
    "tier" INTEGER NOT NULL DEFAULT 1,
    "requirement" INTEGER NOT NULL,
    "reward_xp" INTEGER NOT NULL DEFAULT 0,
    "reward_gems" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_achievements" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "achievement_id" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "is_unlocked" BOOLEAN NOT NULL DEFAULT false,
    "unlocked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quests" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "type" "QuestType" NOT NULL,
    "category" "QuestCategory" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon_url" TEXT,
    "base_requirement" INTEGER NOT NULL,
    "reward_xp" INTEGER NOT NULL DEFAULT 0,
    "reward_gems" INTEGER NOT NULL DEFAULT 0,
    "chest_type" "ChestType",
    "badge_icon_url" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "requires_multiplayer" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_quests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "quest_id" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "requirement" INTEGER NOT NULL,
    "difficulty_level" "DifficultyLevel" NOT NULL DEFAULT 'NORMAL',
    "status" "QuestStatus" NOT NULL DEFAULT 'ACTIVE',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "claimed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_quests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quest_chests" (
    "id" TEXT NOT NULL,
    "user_quest_id" TEXT NOT NULL,
    "chest_type" "ChestType" NOT NULL,
    "status" "ChestStatus" NOT NULL DEFAULT 'LOCKED',
    "reward_xp" INTEGER NOT NULL DEFAULT 0,
    "reward_gems" INTEGER NOT NULL DEFAULT 0,
    "reward_coins" INTEGER NOT NULL DEFAULT 0,
    "xp_boost_minutes" INTEGER,
    "badge_id" TEXT,
    "unlocked_at" TIMESTAMP(3),
    "opened_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quest_chests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "friends_quest_participants" (
    "id" TEXT NOT NULL,
    "quest_key" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "week_start_date" TIMESTAMP(3) NOT NULL,
    "contribution" INTEGER NOT NULL DEFAULT 0,
    "is_creator" BOOLEAN NOT NULL DEFAULT false,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "friends_quest_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leagues" (
    "id" TEXT NOT NULL,
    "tier" "LeagueTier" NOT NULL,
    "week_start_date" TIMESTAMP(3) NOT NULL,
    "week_end_date" TIMESTAMP(3) NOT NULL,
    "status" "LeagueStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leagues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "league_groups" (
    "id" TEXT NOT NULL,
    "league_id" TEXT NOT NULL,
    "group_number" INTEGER NOT NULL,
    "participant_count" INTEGER NOT NULL DEFAULT 0,
    "max_participants" INTEGER NOT NULL DEFAULT 30,
    "is_full" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "league_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "league_participants" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "weekly_xp" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER,
    "is_promoted" BOOLEAN NOT NULL DEFAULT false,
    "is_demoted" BOOLEAN NOT NULL DEFAULT false,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_xp_update" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "league_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "league_histories" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tier" "LeagueTier" NOT NULL,
    "week_start_date" TIMESTAMP(3) NOT NULL,
    "weekly_xp" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,
    "outcome" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "league_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_league_tiers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "current_tier" "LeagueTier" NOT NULL DEFAULT 'BRONZE',
    "current_group_id" TEXT,
    "consecutive_weeks" INTEGER NOT NULL DEFAULT 0,
    "total_promotions" INTEGER NOT NULL DEFAULT 0,
    "total_demotions" INTEGER NOT NULL DEFAULT 0,
    "highest_tier" "LeagueTier" NOT NULL DEFAULT 'BRONZE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_league_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_relationships_follower_id_idx" ON "user_relationships"("follower_id");

-- CreateIndex
CREATE INDEX "user_relationships_following_id_idx" ON "user_relationships"("following_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_relationships_follower_id_following_id_key" ON "user_relationships"("follower_id", "following_id");

-- CreateIndex
CREATE INDEX "user_blocks_blocker_id_idx" ON "user_blocks"("blocker_id");

-- CreateIndex
CREATE INDEX "user_blocks_blocked_user_id_idx" ON "user_blocks"("blocked_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_blocks_blocker_id_blocked_user_id_key" ON "user_blocks"("blocker_id", "blocked_user_id");

-- CreateIndex
CREATE INDEX "user_reports_reported_user_id_idx" ON "user_reports"("reported_user_id");

-- CreateIndex
CREATE INDEX "user_reports_reporter_id_idx" ON "user_reports"("reporter_id");

-- CreateIndex
CREATE INDEX "user_reports_status_idx" ON "user_reports"("status");

-- CreateIndex
CREATE UNIQUE INDEX "achievements_key_key" ON "achievements"("key");

-- CreateIndex
CREATE INDEX "achievements_category_tier_idx" ON "achievements"("category", "tier");

-- CreateIndex
CREATE INDEX "user_achievements_user_id_is_unlocked_idx" ON "user_achievements"("user_id", "is_unlocked");

-- CreateIndex
CREATE UNIQUE INDEX "user_achievements_user_id_achievement_id_key" ON "user_achievements"("user_id", "achievement_id");

-- CreateIndex
CREATE UNIQUE INDEX "quests_key_key" ON "quests"("key");

-- CreateIndex
CREATE INDEX "quests_type_is_active_idx" ON "quests"("type", "is_active");

-- CreateIndex
CREATE INDEX "quests_category_idx" ON "quests"("category");

-- CreateIndex
CREATE INDEX "user_quests_user_id_status_idx" ON "user_quests"("user_id", "status");

-- CreateIndex
CREATE INDEX "user_quests_user_id_end_date_idx" ON "user_quests"("user_id", "end_date");

-- CreateIndex
CREATE UNIQUE INDEX "user_quests_user_id_quest_id_start_date_key" ON "user_quests"("user_id", "quest_id", "start_date");

-- CreateIndex
CREATE UNIQUE INDEX "quest_chests_user_quest_id_key" ON "quest_chests"("user_quest_id");

-- CreateIndex
CREATE INDEX "quest_chests_status_idx" ON "quest_chests"("status");

-- CreateIndex
CREATE INDEX "friends_quest_participants_user_id_week_start_date_idx" ON "friends_quest_participants"("user_id", "week_start_date");

-- CreateIndex
CREATE INDEX "friends_quest_participants_quest_key_week_start_date_idx" ON "friends_quest_participants"("quest_key", "week_start_date");

-- CreateIndex
CREATE UNIQUE INDEX "friends_quest_participants_quest_key_user_id_week_start_dat_key" ON "friends_quest_participants"("quest_key", "user_id", "week_start_date");

-- CreateIndex
CREATE INDEX "leagues_tier_status_idx" ON "leagues"("tier", "status");

-- CreateIndex
CREATE INDEX "leagues_week_start_date_week_end_date_idx" ON "leagues"("week_start_date", "week_end_date");

-- CreateIndex
CREATE UNIQUE INDEX "leagues_tier_week_start_date_key" ON "leagues"("tier", "week_start_date");

-- CreateIndex
CREATE INDEX "league_groups_league_id_is_full_idx" ON "league_groups"("league_id", "is_full");

-- CreateIndex
CREATE UNIQUE INDEX "league_groups_league_id_group_number_key" ON "league_groups"("league_id", "group_number");

-- CreateIndex
CREATE INDEX "league_participants_group_id_weekly_xp_idx" ON "league_participants"("group_id", "weekly_xp");

-- CreateIndex
CREATE INDEX "league_participants_user_id_idx" ON "league_participants"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "league_participants_group_id_user_id_key" ON "league_participants"("group_id", "user_id");

-- CreateIndex
CREATE INDEX "league_histories_user_id_week_start_date_idx" ON "league_histories"("user_id", "week_start_date");

-- CreateIndex
CREATE INDEX "league_histories_user_id_tier_idx" ON "league_histories"("user_id", "tier");

-- CreateIndex
CREATE UNIQUE INDEX "user_league_tiers_user_id_key" ON "user_league_tiers"("user_id");

-- CreateIndex
CREATE INDEX "user_league_tiers_current_tier_idx" ON "user_league_tiers"("current_tier");

-- AddForeignKey
ALTER TABLE "user_relationships" ADD CONSTRAINT "user_relationships_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_relationships" ADD CONSTRAINT "user_relationships_following_id_fkey" FOREIGN KEY ("following_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blocker_id_fkey" FOREIGN KEY ("blocker_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blocked_user_id_fkey" FOREIGN KEY ("blocked_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_reported_user_id_fkey" FOREIGN KEY ("reported_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "achievements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_quests" ADD CONSTRAINT "user_quests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_quests" ADD CONSTRAINT "user_quests_quest_id_fkey" FOREIGN KEY ("quest_id") REFERENCES "quests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quest_chests" ADD CONSTRAINT "quest_chests_user_quest_id_fkey" FOREIGN KEY ("user_quest_id") REFERENCES "user_quests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friends_quest_participants" ADD CONSTRAINT "friends_quest_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_groups" ADD CONSTRAINT "league_groups_league_id_fkey" FOREIGN KEY ("league_id") REFERENCES "leagues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_participants" ADD CONSTRAINT "league_participants_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "league_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_participants" ADD CONSTRAINT "league_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_histories" ADD CONSTRAINT "league_histories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_league_tiers" ADD CONSTRAINT "user_league_tiers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
