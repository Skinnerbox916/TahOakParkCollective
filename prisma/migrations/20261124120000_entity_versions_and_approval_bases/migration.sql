-- Versioned approvals (src/lib/entities). Additive except the dead
-- ApprovalType values, which no row has ever used.

-- Pending UPDATE_ENTITY approvals hold legacy full snapshots with no base to
-- check against, so they can't be applied safely. Retire them; the submitter
-- can resubmit. (Production had none when this was written.)
UPDATE "Approval"
SET "status" = 'REJECTED',
    "reviewedAt" = NOW(),
    "notes" = 'Closed automatically by the approval redesign (2026-11). Please resubmit.'
WHERE "status" = 'PENDING' AND "type" = 'UPDATE_ENTITY';

-- AlterEnum
BEGIN;
CREATE TYPE "ApprovalType_new" AS ENUM ('NEW_ENTITY', 'UPDATE_ENTITY');
ALTER TABLE "Approval" ALTER COLUMN "type" TYPE "ApprovalType_new" USING ("type"::text::"ApprovalType_new");
ALTER TYPE "ApprovalType" RENAME TO "ApprovalType_old";
ALTER TYPE "ApprovalType_new" RENAME TO "ApprovalType";
DROP TYPE "public"."ApprovalType_old";
COMMIT;

-- Keep approval history when an entity is deleted
ALTER TABLE "Approval" DROP CONSTRAINT "Approval_entityId_fkey";
ALTER TABLE "Approval" DROP CONSTRAINT "Approval_targetEntityId_fkey";

ALTER TABLE "Approval" ADD COLUMN     "baseValues" JSONB,
ADD COLUMN     "baseVersion" INTEGER,
ADD COLUMN     "checks" JSONB;

ALTER TABLE "Entity" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "Approval" ADD CONSTRAINT "Approval_targetEntityId_fkey" FOREIGN KEY ("targetEntityId") REFERENCES "Entity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- IssueReport.entityId had no foreign key; drop reports for entities that no
-- longer exist before adding one.
DELETE FROM "IssueReport" WHERE "entityId" NOT IN (SELECT "id" FROM "Entity");
ALTER TABLE "IssueReport" ADD CONSTRAINT "IssueReport_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
