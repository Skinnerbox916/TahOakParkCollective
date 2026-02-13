-- Drop ownershipMetadata column from Entity
ALTER TABLE "Entity"
  DROP COLUMN IF EXISTS "ownershipMetadata";

-- Remove ownershipMetadata from approval snapshots to avoid stale data
UPDATE "Approval"
SET "proposedEntityData" = "proposedEntityData" - 'ownershipMetadata'
WHERE "proposedEntityData" ? 'ownershipMetadata';

