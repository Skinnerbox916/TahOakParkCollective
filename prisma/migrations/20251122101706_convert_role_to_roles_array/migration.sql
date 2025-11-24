-- AlterTable: Convert single role to roles array
-- Step 1: Add new roles column
ALTER TABLE "User" ADD COLUMN "roles" "Role"[] DEFAULT ARRAY['USER']::"Role"[];

-- Step 2: Migrate existing data
-- For users with USER role: keep just [USER]
-- For users with other roles: set to [USER, <existing_role>]
UPDATE "User" 
SET "roles" = CASE 
  WHEN "role" = 'USER' THEN ARRAY['USER']::"Role"[]
  ELSE ARRAY['USER', "role"]::"Role"[]
END;

-- Step 3: Make roles NOT NULL (remove default since all rows now have values)
ALTER TABLE "User" ALTER COLUMN "roles" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "roles" DROP DEFAULT;

-- Step 4: Drop old role column
ALTER TABLE "User" DROP COLUMN "role";

