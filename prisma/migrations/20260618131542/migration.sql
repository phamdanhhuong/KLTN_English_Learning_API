/*
  Warnings:

  - Added the required column `group_id` to the `friends_quest_participants` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ItemCategory" AS ENUM ('FRAME', 'BACKGROUND', 'BOOST_XP', 'STREAK_FREEZE', 'CHEST');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ParticipantStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CurrencyTransactionReason" ADD VALUE 'SHOP_PURCHASE';
ALTER TYPE "CurrencyTransactionReason" ADD VALUE 'CHEST_OPENED';

-- DropIndex
DROP INDEX "friends_quest_participants_quest_key_week_start_date_idx";

-- AlterTable
ALTER TABLE "friends_quest_participants" ADD COLUMN     "group_id" TEXT NOT NULL,
ADD COLUMN     "status" "ParticipantStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "hide_battle_history" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "payment_orders" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "order_code" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "gems" INTEGER NOT NULL DEFAULT 0,
    "coins" INTEGER NOT NULL DEFAULT 0,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "vnp_transaction_no" TEXT,
    "vnp_bank_code" TEXT,
    "vnp_pay_date" TEXT,
    "vnp_response_code" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_gamification_stats" (
    "user_id" TEXT NOT NULL,
    "perfect_lesson_count" INTEGER NOT NULL DEFAULT 0,
    "perfect_lesson_streak" INTEGER NOT NULL DEFAULT 0,
    "fast_lesson_count" INTEGER NOT NULL DEFAULT 0,
    "quests_completed_count" INTEGER NOT NULL DEFAULT 0,
    "cheers_sent_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_gamification_stats_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "friends_quest_groups" (
    "id" TEXT NOT NULL,
    "quest_key" TEXT NOT NULL,
    "week_start_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "friends_quest_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shop_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "ItemCategory" NOT NULL,
    "price" INTEGER NOT NULL,
    "currency_type" "CurrencyType" NOT NULL,
    "image_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shop_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_inventories" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "acquired_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_inventories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_equipped_items" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "frame_id" TEXT,
    "background_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_equipped_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roadmaps" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "target_goal" "LearningGoal" NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roadmaps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestones" (
    "id" TEXT NOT NULL,
    "roadmap_id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "target_level" "ProficiencyLevel" NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "capstone_test_id" TEXT,

    CONSTRAINT "milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestone_skills" (
    "milestone_id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,

    CONSTRAINT "milestone_skills_pkey" PRIMARY KEY ("milestone_id","skill_id")
);

-- CreateTable
CREATE TABLE "user_roadmaps" (
    "user_id" TEXT NOT NULL,
    "roadmap_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "user_roadmaps_pkey" PRIMARY KEY ("user_id","roadmap_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_orders_order_code_key" ON "payment_orders"("order_code");

-- CreateIndex
CREATE INDEX "payment_orders_user_id_created_at_idx" ON "payment_orders"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "payment_orders_order_code_idx" ON "payment_orders"("order_code");

-- CreateIndex
CREATE INDEX "friends_quest_groups_quest_key_week_start_date_idx" ON "friends_quest_groups"("quest_key", "week_start_date");

-- CreateIndex
CREATE INDEX "shop_items_category_is_active_idx" ON "shop_items"("category", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "user_inventories_user_id_item_id_key" ON "user_inventories"("user_id", "item_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_equipped_items_user_id_key" ON "user_equipped_items"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "milestones_capstone_test_id_key" ON "milestones"("capstone_test_id");

-- CreateIndex
CREATE INDEX "friends_quest_participants_group_id_idx" ON "friends_quest_participants"("group_id");

-- AddForeignKey
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_gamification_stats" ADD CONSTRAINT "user_gamification_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friends_quest_participants" ADD CONSTRAINT "friends_quest_participants_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "friends_quest_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_inventories" ADD CONSTRAINT "user_inventories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_inventories" ADD CONSTRAINT "user_inventories_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "shop_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_equipped_items" ADD CONSTRAINT "user_equipped_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_roadmap_id_fkey" FOREIGN KEY ("roadmap_id") REFERENCES "roadmaps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestone_skills" ADD CONSTRAINT "milestone_skills_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "milestones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestone_skills" ADD CONSTRAINT "milestone_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roadmaps" ADD CONSTRAINT "user_roadmaps_roadmap_id_fkey" FOREIGN KEY ("roadmap_id") REFERENCES "roadmaps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roadmaps" ADD CONSTRAINT "user_roadmaps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
