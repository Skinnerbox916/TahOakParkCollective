-- AlterTable: Add translation fields to Category
ALTER TABLE "Category" ADD COLUMN "nameTranslations" JSONB;
ALTER TABLE "Category" ADD COLUMN "descriptionTranslations" JSONB;

-- AlterTable: Add translation fields to Entity
ALTER TABLE "Entity" ADD COLUMN "nameTranslations" JSONB;
ALTER TABLE "Entity" ADD COLUMN "descriptionTranslations" JSONB;

-- AlterTable: Add translation field to Tag
ALTER TABLE "Tag" ADD COLUMN "nameTranslations" JSONB;

-- Data Migration: Copy existing data to translation fields for Categories
UPDATE "Category" 
SET "nameTranslations" = jsonb_build_object('en', name),
    "descriptionTranslations" = CASE 
      WHEN description IS NOT NULL 
      THEN jsonb_build_object('en', description)
      ELSE NULL
    END;

-- Data Migration: Copy existing data to translation fields for Entities
UPDATE "Entity"
SET "nameTranslations" = jsonb_build_object('en', name),
    "descriptionTranslations" = CASE
      WHEN description IS NOT NULL
      THEN jsonb_build_object('en', description)
      ELSE NULL
    END;

-- Data Migration: Copy existing data to translation fields for Tags
UPDATE "Tag"
SET "nameTranslations" = jsonb_build_object('en', name);
