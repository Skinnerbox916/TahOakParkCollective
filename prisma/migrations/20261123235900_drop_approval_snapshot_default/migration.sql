-- Production's Approval."proposedEntityData" kept DEFAULT '{}' from the
-- migration history before the 2026-02 squash; schema.prisma has no default.
-- This is a no-op on databases built from the squashed init migration.
ALTER TABLE "Approval" ALTER COLUMN "proposedEntityData" DROP DEFAULT;
