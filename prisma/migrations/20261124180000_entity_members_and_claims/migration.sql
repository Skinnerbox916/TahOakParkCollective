-- Ownership becomes EntityMember rows; claims become CLAIM_ENTITY approvals.
-- Expand step: Entity.ownerId is only made nullable here (the previous release
-- still reads it during the rolling deploy). A later migration drops it.

-- Data that would block the enum changes below
UPDATE "User" SET "roles" = array_remove("roles", 'ENTITY_OWNER'::"Role") WHERE 'ENTITY_OWNER'::"Role" = ANY("roles");
DELETE FROM "MagicLink" WHERE "purpose" = 'CLAIM_ENTITY';

-- Interim email-link claims (UPDATE_ENTITY with source 'claim') can't be
-- approved anymore; claimants sign in and claim again.
UPDATE "Approval"
SET "status" = 'REJECTED',
    "reviewedAt" = NOW(),
    "notes" = 'Closed automatically: claims now require signing in. Please claim again.'
WHERE "status" = 'PENDING' AND "source" = 'claim';

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('OWNER', 'MANAGER');

-- AlterEnum
ALTER TYPE "ApprovalType" ADD VALUE 'CLAIM_ENTITY';

-- AlterEnum
BEGIN;
CREATE TYPE "MagicLinkPurpose_new" AS ENUM ('VERIFY_SUBSCRIPTION', 'MANAGE_PREFERENCES');
ALTER TABLE "MagicLink" ALTER COLUMN "purpose" TYPE "MagicLinkPurpose_new" USING ("purpose"::text::"MagicLinkPurpose_new");
ALTER TYPE "MagicLinkPurpose" RENAME TO "MagicLinkPurpose_old";
ALTER TYPE "MagicLinkPurpose_new" RENAME TO "MagicLinkPurpose";
DROP TYPE "public"."MagicLinkPurpose_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('USER', 'ADMIN');
ALTER TABLE "public"."User" ALTER COLUMN "roles" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "roles" TYPE "Role_new"[] USING ("roles"::text::"Role_new"[]);
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
ALTER TABLE "User" ALTER COLUMN "roles" SET DEFAULT ARRAY['USER']::"Role"[];
COMMIT;

ALTER TABLE "Entity" DROP CONSTRAINT "Entity_ownerId_fkey";
ALTER TABLE "Entity" ALTER COLUMN "ownerId" DROP NOT NULL;

CREATE TABLE "EntityMember" (
    "id" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'OWNER',
    "addedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntityMember_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EntityMember_userId_idx" ON "EntityMember"("userId");
CREATE UNIQUE INDEX "EntityMember_entityId_userId_key" ON "EntityMember"("entityId", "userId");

ALTER TABLE "Entity" ADD CONSTRAINT "Entity_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EntityMember" ADD CONSTRAINT "EntityMember_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EntityMember" ADD CONSTRAINT "EntityMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: a listing owned by a non-admin keeps that person as its OWNER.
-- Listings "owned" by an admin account were never really claimed; they
-- become unclaimed (no members).
INSERT INTO "EntityMember" ("id", "entityId", "userId", "role", "createdAt")
SELECT gen_random_uuid()::text, e."id", e."ownerId", 'OWNER', NOW()
FROM "Entity" e
JOIN "User" u ON u."id" = e."ownerId"
WHERE NOT ('ADMIN'::"Role" = ANY(u."roles"));
