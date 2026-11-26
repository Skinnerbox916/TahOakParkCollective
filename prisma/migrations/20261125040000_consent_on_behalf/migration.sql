-- An admin can publish a listing for an owner who agreed offline. These record
-- who agreed, how, and which admin recorded it. Nullable and additive.
-- AlterTable
ALTER TABLE "Entity" ADD COLUMN     "consentGivenBy" TEXT,
ADD COLUMN     "consentMethod" TEXT,
ADD COLUMN     "consentNote" TEXT,
ADD COLUMN     "consentRecordedById" TEXT;

-- AddForeignKey
ALTER TABLE "Entity" ADD CONSTRAINT "Entity_consentRecordedById_fkey" FOREIGN KEY ("consentRecordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

