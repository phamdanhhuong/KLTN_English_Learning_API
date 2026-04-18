-- CreateEnum
CREATE TYPE "BattleStatus" AS ENUM ('WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "BattleOutcome" AS ENUM ('WIN', 'LOSE', 'DRAW');

-- CreateTable
CREATE TABLE "battle_matches" (
    "id" TEXT NOT NULL,
    "status" "BattleStatus" NOT NULL DEFAULT 'WAITING',
    "player1_id" TEXT NOT NULL,
    "player2_id" TEXT,
    "player1_score" INTEGER NOT NULL DEFAULT 0,
    "player2_score" INTEGER NOT NULL DEFAULT 0,
    "winner_id" TEXT,
    "xp_awarded_1" INTEGER NOT NULL DEFAULT 0,
    "xp_awarded_2" INTEGER NOT NULL DEFAULT 0,
    "total_rounds" INTEGER NOT NULL DEFAULT 5,
    "tier" TEXT,
    "is_bot" BOOLEAN NOT NULL DEFAULT false,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "battle_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "battle_rounds" (
    "id" TEXT NOT NULL,
    "match_id" TEXT NOT NULL,
    "round_number" INTEGER NOT NULL,
    "question_type" TEXT NOT NULL,
    "question_data" JSONB NOT NULL,
    "player1_answer" TEXT,
    "player2_answer" TEXT,
    "player1_time_ms" INTEGER,
    "player2_time_ms" INTEGER,
    "player1_points" INTEGER NOT NULL DEFAULT 0,
    "player2_points" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "battle_rounds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "battle_matches_player1_id_idx" ON "battle_matches"("player1_id");

-- CreateIndex
CREATE INDEX "battle_matches_player2_id_idx" ON "battle_matches"("player2_id");

-- CreateIndex
CREATE INDEX "battle_matches_status_idx" ON "battle_matches"("status");

-- CreateIndex
CREATE UNIQUE INDEX "battle_rounds_match_id_round_number_key" ON "battle_rounds"("match_id", "round_number");

-- AddForeignKey
ALTER TABLE "battle_matches" ADD CONSTRAINT "battle_matches_player1_id_fkey" FOREIGN KEY ("player1_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "battle_matches" ADD CONSTRAINT "battle_matches_player2_id_fkey" FOREIGN KEY ("player2_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "battle_rounds" ADD CONSTRAINT "battle_rounds_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "battle_matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
