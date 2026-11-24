-- Contract, step 1 of 2: Entity.ownerId was replaced by EntityMember.
-- Drop its foreign key and index; the client no longer reads the column
-- (@ignore). The next migration drops the column once this release is live.
ALTER TABLE "Entity" DROP CONSTRAINT "Entity_ownerId_fkey";
DROP INDEX "Entity_ownerId_idx";
