/**
 * Migration script to add Spanish translations to existing tags
 * 
 * This script:
 * 1. Fetches all tags that don't have nameTranslations
 * 2. Uses the DeepL translation service to translate English names to Spanish
 * 3. Updates tags with the nameTranslations field
 * 
 * Usage (from Docker container):
 * docker exec tahoak-web npx tsx scripts/migrate-tag-translations.ts
 * 
 * Or locally:
 * npx tsx scripts/migrate-tag-translations.ts
 */

import { Prisma } from "@prisma/client";
import { prisma } from "../src/lib/prisma";
import { getTranslationService } from "../src/lib/translate";

async function migrateTagTranslations() {
  console.log("Starting tag translation migration...\n");

  try {
    // Fetch all tags that don't have nameTranslations
    const tags = await prisma.tag.findMany({
      where: {
        OR: [
          { nameTranslations: null },
          { nameTranslations: Prisma.JsonNull },
        ],
      },
    });

    if (tags.length === 0) {
      console.log("No tags found that need translation. All tags already have translations.");
      return;
    }

    console.log(`Found ${tags.length} tag(s) to translate:\n`);

    const translationService = getTranslationService();
    console.log(`Using translation provider: ${translationService.getProviderName()}\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const tag of tags) {
      try {
        console.log(`Translating: "${tag.name}"...`);

        // Translate English to Spanish
        const spanishTranslation = await translationService.translate(
          tag.name,
          'es',
          'en'
        );

        // Update tag with translations
        await prisma.tag.update({
          where: { id: tag.id },
          data: {
            nameTranslations: {
              en: tag.name,
              es: spanishTranslation,
            },
          },
        });

        console.log(`  ✓ Translated to: "${spanishTranslation}"`);
        successCount++;

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`  ✗ Error translating "${tag.name}":`, error);
        errorCount++;
      }
    }

    console.log(`\nMigration complete!`);
    console.log(`  Successfully translated: ${successCount}`);
    console.log(`  Errors: ${errorCount}`);
    console.log(`  Total tags: ${tags.length}`);

  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateTagTranslations();

