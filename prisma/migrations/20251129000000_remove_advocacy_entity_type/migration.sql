-- Step 1: Update existing ADVOCACY entities to NON_PROFIT
UPDATE "Entity" SET "entityType" = 'NON_PROFIT' WHERE "entityType" = 'ADVOCACY';

-- Step 2: Update Category entityTypes arrays to remove ADVOCACY
UPDATE "Category" 
SET "entityTypes" = array_remove("entityTypes", 'ADVOCACY'::"EntityType");

-- Step 3: Remove ADVOCACY from EntityType enum
-- PostgreSQL doesn't support direct removal of enum values, so we need to:
-- 1. Create a new enum without ADVOCACY
-- 2. Drop defaults, update columns, restore defaults
-- 3. Drop the old enum
-- 4. Rename the new enum

-- Create new enum without ADVOCACY
CREATE TYPE "EntityType_new" AS ENUM ('COMMERCE', 'CIVIC', 'PUBLIC_SPACE', 'NON_PROFIT', 'EVENT', 'SERVICE_PROVIDER');

-- Drop default on Entity.entityType before conversion
ALTER TABLE "Entity" ALTER COLUMN "entityType" DROP DEFAULT;

-- Update Entity table to use new enum
ALTER TABLE "Entity" ALTER COLUMN "entityType" TYPE "EntityType_new" USING ("entityType"::text::"EntityType_new");

-- Restore default
ALTER TABLE "Entity" ALTER COLUMN "entityType" SET DEFAULT 'COMMERCE'::"EntityType_new";

-- Update Category table to use new enum for the array
ALTER TABLE "Category" ALTER COLUMN "entityTypes" TYPE "EntityType_new"[] USING ("entityTypes"::text[]::"EntityType_new"[]);

-- Drop old enum
DROP TYPE "EntityType";

-- Rename new enum to original name
ALTER TYPE "EntityType_new" RENAME TO "EntityType";
