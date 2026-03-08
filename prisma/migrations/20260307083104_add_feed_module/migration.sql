-- CreateEnum
CREATE TYPE "FeedPostType" AS ENUM ('STREAK_MILESTONE', 'LEAGUE_PROMOTION', 'LEAGUE_TOP_3', 'NEW_FOLLOWER', 'ACHIEVEMENT_UNLOCKED', 'LEVEL_UP', 'QUEST_COMPLETED', 'PERFECT_SCORE', 'XP_MILESTONE');

-- CreateEnum
CREATE TYPE "FeedReactionType" AS ENUM ('CONGRATS', 'FIRE', 'CLAP', 'HEART', 'STRONG');

-- CreateTable
CREATE TABLE "feed_posts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "post_type" "FeedPostType" NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "image_url" TEXT,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feed_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feed_reactions" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "reaction_type" "FeedReactionType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feed_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feed_comments" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_edited" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feed_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "feed_posts_user_id_created_at_idx" ON "feed_posts"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "feed_posts_is_visible_created_at_idx" ON "feed_posts"("is_visible", "created_at" DESC);

-- CreateIndex
CREATE INDEX "feed_reactions_post_id_idx" ON "feed_reactions"("post_id");

-- CreateIndex
CREATE INDEX "feed_reactions_user_id_idx" ON "feed_reactions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "feed_reactions_post_id_user_id_key" ON "feed_reactions"("post_id", "user_id");

-- CreateIndex
CREATE INDEX "feed_comments_post_id_created_at_idx" ON "feed_comments"("post_id", "created_at");

-- CreateIndex
CREATE INDEX "feed_comments_user_id_idx" ON "feed_comments"("user_id");

-- AddForeignKey
ALTER TABLE "feed_posts" ADD CONSTRAINT "feed_posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_reactions" ADD CONSTRAINT "feed_reactions_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "feed_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_reactions" ADD CONSTRAINT "feed_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_comments" ADD CONSTRAINT "feed_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "feed_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_comments" ADD CONSTRAINT "feed_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
