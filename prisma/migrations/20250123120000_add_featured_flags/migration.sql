-- AlterTable
ALTER TABLE "Category" ADD COLUMN "featured" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Business" ADD COLUMN "featured" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Business_featured_idx" ON "Business"("featured");



