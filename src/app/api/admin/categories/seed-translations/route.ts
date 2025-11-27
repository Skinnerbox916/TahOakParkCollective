import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-helpers";

const categoryTranslations: Record<string, string> = {
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
  "Government Office": "Oficina Gubernamental",
  "Community Group": "Grupo Comunitario",
  "Community Center": "Centro Comunitario",
  "Education": "Educación",
  "Spiritual": "Espiritual",
  "Health & Wellness": "Salud y Bienestar",
};

// TEMPORARY: No auth required for one-time seed operation
// TODO: Re-enable auth after initial seed, or remove this endpoint
export async function POST(request: NextRequest) {
  try {
    const results: Array<{ category: string; success: boolean; error?: string }> = [];

    for (const [englishName, spanishName] of Object.entries(categoryTranslations)) {
      try {
        const category = await prisma.category.findUnique({
          where: { name: englishName },
        });

        if (category) {
          // Use raw SQL to update since Prisma client may be cached
          await prisma.$executeRaw`
            UPDATE "Category" 
            SET "nameTranslations" = jsonb_set(
              COALESCE("nameTranslations", jsonb_build_object('en', name)),
              '{es}',
              to_jsonb(${spanishName}::text)
            )
            WHERE id = ${category.id}
          `;

          results.push({ category: englishName, success: true });
        } else {
          results.push({ category: englishName, success: false, error: "Category not found" });
        }
      } catch (error: any) {
        results.push({ category: englishName, success: false, error: error?.message || "Unknown error" });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return createSuccessResponse({
      results,
      summary: {
        total: results.length,
        success: successCount,
        failed: failCount,
      },
    }, `Updated ${successCount} category translations. ${failCount} failed.`);
  } catch (error: any) {
    console.error("Error seeding category translations:", error);
    return createErrorResponse(`Failed to seed translations: ${error?.message || "Unknown error"}`, 500);
  }
}
