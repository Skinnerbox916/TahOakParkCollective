-- Unify approvals to snapshot model

-- Add snapshot + target columns
ALTER TABLE "Approval"
  ADD COLUMN "proposedEntityData" JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN "targetEntityId" TEXT;

-- FK for target entity (updates). Keep entityId for created entities.
ALTER TABLE "Approval"
  ADD CONSTRAINT "Approval_targetEntityId_fkey"
    FOREIGN KEY ("targetEntityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Drop legacy diff/draft columns
ALTER TABLE "Approval"
  DROP COLUMN IF EXISTS "entityData",
  DROP COLUMN IF EXISTS "fieldName",
  DROP COLUMN IF EXISTS "oldValue",
  DROP COLUMN IF EXISTS "newValue";

-- Index for targetEntityId lookups
CREATE INDEX IF NOT EXISTS "Approval_targetEntityId_idx" ON "Approval"("targetEntityId");


