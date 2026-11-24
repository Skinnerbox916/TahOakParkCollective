-- Contract, step 2 of 2: drop Entity.ownerId. Ownership is EntityMember
-- (20261124180000); the release this replaces no longer reads the column.
ALTER TABLE "Entity" DROP COLUMN "ownerId";
