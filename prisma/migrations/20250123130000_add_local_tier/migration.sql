-- CreateEnum
CREATE TYPE "LocalTier" AS ENUM ('LEVEL_1_NEIGHBORS', 'LEVEL_2_ANCHORS', 'LEVEL_3_BOOSTERS', 'LEVEL_4_HOMEGROWN_SUCCESS');

-- AlterTable
ALTER TABLE "Business" ADD COLUMN "localTier" "LocalTier";

-- CreateIndex
CREATE INDEX "Business_localTier_idx" ON "Business"("localTier");



