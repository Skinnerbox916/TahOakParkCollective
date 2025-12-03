-- Convert SEO fields from single text columns to translation JSON columns
-- This aligns with the platform's bilingual (en/es) translation system

-- Drop old single-field SEO columns
ALTER TABLE "Entity" DROP COLUMN IF EXISTS "seoTitle";
ALTER TABLE "Entity" DROP COLUMN IF EXISTS "seoDescription";

-- Add new translation JSON columns for SEO
ALTER TABLE "Entity" ADD COLUMN "seoTitleTranslations" JSONB;
ALTER TABLE "Entity" ADD COLUMN "seoDescriptionTranslations" JSONB;



