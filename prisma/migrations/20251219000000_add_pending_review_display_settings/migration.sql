-- Add PENDING_REVIEW status for draft entities awaiting approval
-- Add displaySettings to control field visibility on entity profiles

-- Add PENDING_REVIEW to EntityStatus enum
ALTER TYPE "EntityStatus" ADD VALUE IF NOT EXISTS 'PENDING_REVIEW';

-- Add displaySettings JSONB column to Entity table
ALTER TABLE "Entity" ADD COLUMN IF NOT EXISTS "displaySettings" JSONB;
