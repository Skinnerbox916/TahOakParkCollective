-- AlterTable
ALTER TABLE "Entity" ADD COLUMN     "consentTermsVersion" TEXT,
ADD COLUMN     "consentedAt" TIMESTAMP(3),
ADD COLUMN     "consentedById" TEXT;

-- CreateTable
CREATE TABLE "EntityShareLink" (
    "id" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "sentTo" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "usedById" TEXT,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "EntityShareLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EntityShareLink_tokenHash_key" ON "EntityShareLink"("tokenHash");

-- CreateIndex
CREATE INDEX "EntityShareLink_entityId_idx" ON "EntityShareLink"("entityId");

-- AddForeignKey
ALTER TABLE "Entity" ADD CONSTRAINT "Entity_consentedById_fkey" FOREIGN KEY ("consentedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityShareLink" ADD CONSTRAINT "EntityShareLink_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Owner opt-in. Listings of these types may only be ACTIVE with their owner's
-- recorded consent. PUBLIC_SPACE and CIVIC have no owner and are exempt; keep
-- this list in step with CONSENT_EXEMPT_TYPES in src/lib/entities/consent.ts.

-- 1. Nothing has consent yet, so hide every listing that needs it.
UPDATE "Entity"
SET "status" = 'INACTIVE', "version" = "version" + 1, "updatedAt" = CURRENT_TIMESTAMP
WHERE "status" = 'ACTIVE'
  AND "consentedAt" IS NULL
  AND "entityType" NOT IN ('PUBLIC_SPACE', 'CIVIC');

-- 2. Identity tags (Black-owned, ...) are the owner's to set. None of the
-- existing ones were set by an owner who consented, so remove them.
DELETE FROM "EntityTag" et
USING "Tag" t, "Entity" e
WHERE et."tagId" = t."id"
  AND et."entityId" = e."id"
  AND t."category" = 'IDENTITY'
  AND e."consentedAt" IS NULL;

-- 3. Enforce it in the database, whatever the application does.
ALTER TABLE "Entity" ADD CONSTRAINT "Entity_active_needs_consent"
  CHECK ("status" <> 'ACTIVE' OR "consentedAt" IS NOT NULL OR "entityType" IN ('PUBLIC_SPACE', 'CIVIC'));
