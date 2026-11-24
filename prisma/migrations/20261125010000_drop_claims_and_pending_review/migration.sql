-- Claims were replaced by share links (20261125000000_owner_opt_in), and no
-- flow ever set PENDING_REVIEW. Drop both enum values. One transaction, so a
-- failure leaves everything as it was.
BEGIN;

DELETE FROM "Approval" WHERE "type" = 'CLAIM_ENTITY';
UPDATE "Entity" SET "status" = 'INACTIVE' WHERE "status" = 'PENDING_REVIEW';

-- The opt-in constraint compares "status" against the enum being replaced.
ALTER TABLE "Entity" DROP CONSTRAINT "Entity_active_needs_consent";

-- AlterEnum
CREATE TYPE "ApprovalType_new" AS ENUM ('NEW_ENTITY', 'UPDATE_ENTITY');
ALTER TABLE "Approval" ALTER COLUMN "type" TYPE "ApprovalType_new" USING ("type"::text::"ApprovalType_new");
ALTER TYPE "ApprovalType" RENAME TO "ApprovalType_old";
ALTER TYPE "ApprovalType_new" RENAME TO "ApprovalType";
DROP TYPE "public"."ApprovalType_old";

-- AlterEnum
CREATE TYPE "EntityStatus_new" AS ENUM ('ACTIVE', 'INACTIVE');
ALTER TABLE "public"."Entity" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Entity" ALTER COLUMN "status" TYPE "EntityStatus_new" USING ("status"::text::"EntityStatus_new");
ALTER TYPE "EntityStatus" RENAME TO "EntityStatus_old";
ALTER TYPE "EntityStatus_new" RENAME TO "EntityStatus";
DROP TYPE "public"."EntityStatus_old";
ALTER TABLE "Entity" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- Same rule as before; keep in step with CONSENT_EXEMPT_TYPES in src/lib/entities/policy.ts.
ALTER TABLE "Entity" ADD CONSTRAINT "Entity_active_needs_consent"
  CHECK ("status" <> 'ACTIVE' OR "consentedAt" IS NOT NULL OR "entityType" IN ('PUBLIC_SPACE', 'CIVIC'));

COMMIT;
