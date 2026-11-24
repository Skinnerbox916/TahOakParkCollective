-- Better Auth, contract step: drop what next-auth left behind. The release
-- this replaces already ignores these columns and never queries the tables.

-- Safety: anyone who registered through the old release while the previous
-- deploy rolled out has a password here but no Better Auth credential yet.
INSERT INTO "AuthAccount" ("id", "accountId", "providerId", "userId", "password", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, u."id", 'credential', u."id", u."password", NOW(), NOW()
FROM "User" u
WHERE u."password" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "AuthAccount" a WHERE a."userId" = u."id" AND a."providerId" = 'credential'
  );

ALTER TABLE "Account" DROP CONSTRAINT "Account_userId_fkey";
ALTER TABLE "Session" DROP CONSTRAINT "Session_userId_fkey";

ALTER TABLE "User" DROP COLUMN "emailVerified",
DROP COLUMN "password",
DROP COLUMN "roles";

DROP TABLE "Account";
DROP TABLE "Session";
DROP TABLE "VerificationToken";

DROP TYPE "Role";
