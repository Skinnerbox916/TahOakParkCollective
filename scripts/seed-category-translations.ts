import { prisma } from "../src/lib/prisma";

const categoryTranslations: Record<string, string> = {
  // Categories we've already translated (from screenshot)
  "Business Improvement District": "Distrito de Mejoramiento Comercial",
  "Community Health": "Salud Comunitaria",
  "Elected Official": "Funcionario Electo",
  "Entertainment": "Entretenimiento",
  "Food & Drink": "Comida y Bebida",
  "Library": "Biblioteca",
  "Neighborhood Association": "Asociación de Vecinos",
  "Park": "Parque",
  "Retail": "Venta al por menor",
  "Services": "Servicios",
  "Social Services": "Servicios Sociales",
  
  // Additional categories that may exist
  "Government Office": "Oficina Gubernamental",
  "Community Group": "Grupo Comunitario",
  "Community Center": "Centro Comunitario",
  "Education": "Educación",
  "Spiritual": "Espiritual",
  "Health & Wellness": "Salud y Bienestar",
};

async function main() {
  console.log("Starting category translation seed...");

  try {
    // First, let's see what categories exist
    const allCategories = await prisma.category.findMany({
      select: { id: true, name: true, nameTranslations: true },
    });
    
    console.log(`Found ${allCategories.length} categories in database`);
    
    for (const [englishName, spanishName] of Object.entries(categoryTranslations)) {
      try {
        // Find the category by name
        const category = await prisma.category.findUnique({
          where: { name: englishName },
        });

        if (category) {
          // Get existing translations or create default
          const existingTranslations = (category.nameTranslations as { [key: string]: string } | null) || { en: category.name };
          
          // Update with Spanish translation
          const updatedTranslations = {
            ...existingTranslations,
            es: spanishName,
          };

          await prisma.category.update({
            where: { id: category.id },
            data: {
              nameTranslations: updatedTranslations,
            },
          });

          console.log(`✓ Updated translation for: ${englishName} -> ${spanishName}`);
        } else {
          console.log(`⚠ Category not found: ${englishName}`);
        }
      } catch (error: any) {
        console.error(`✗ Error updating ${englishName}:`, error?.message || error);
      }
    }
  } catch (error: any) {
    console.error("Fatal error connecting to database:", error?.message || error);
    throw error;
  }

  console.log("\nSeed completed.");
}

main()
  .catch((e) => {
    console.error("Fatal error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
