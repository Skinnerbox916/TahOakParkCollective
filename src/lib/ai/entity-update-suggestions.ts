import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { ENTITY_TYPE } from "@/lib/prismaEnums";
import type { EntityWithRelations } from "@/types";

type SuggestionConfidence = "high" | "medium" | "low";

export interface EntityUpdateSuggestion {
  field: string;
  fieldLabel?: string;
  currentValue: unknown;
  suggestedValue: unknown;
  reasoning?: string;
  confidence?: SuggestionConfidence;
  accepted?: boolean;
}

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set. Please configure it in your environment.");
  }
  return new OpenAI({ apiKey });
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "(none)";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

export async function suggestEntityUpdates(entity: EntityWithRelations): Promise<EntityUpdateSuggestion[]> {
  // Fetch categories and tags to ground the model with valid slugs
  const categories = await prisma.category.findMany({
    select: { name: true, slug: true },
    orderBy: { name: "asc" },
  });

  const tags = await prisma.tag.findMany({
    select: { name: true, slug: true, category: true },
    orderBy: { name: "asc" },
  });

  const categoryList = categories.map((c) => `${c.name} (slug: ${c.slug})`).join(", ");
  const tagList = tags.map((t) => `${t.name} (slug: ${t.slug}, category: ${t.category})`).join(", ");

  // Current entity snapshot for prompt context
  const currentData = {
    name: entity.name,
    description: entity.description || "(none)",
    address: entity.address || "(none)",
    phone: entity.phone || "(none)",
    website: entity.website || "(none)",
    entityType: entity.entityType,
    categories: (entity.categories || []).map((c) => `${c.name} (slug: ${c.slug})`).join(", "),
    tags: (entity.tags || []).map((et) => et.tag?.slug || et.tagId).join(", "),
    hours: entity.hours || null,
    socialMedia: entity.socialMedia || null,
    nameTranslations: entity.nameTranslations || null,
    descriptionTranslations: entity.descriptionTranslations || null,
    seoTitleTranslations: (entity as any).seoTitleTranslations || null,
    seoDescriptionTranslations: (entity as any).seoDescriptionTranslations || null,
  };

  const entityTypes = Object.values(ENTITY_TYPE).join(", ");

  const prompt = `You are auditing an existing business/organization listing for accuracy and completeness in Sacramento neighborhoods (Tahoe Park, Oak Park, Elmhurst, Colonial Park, Curtis Park).

CURRENT LISTING DATA:
- Name: ${currentData.name}
- Description: ${formatValue(currentData.description)}
- Address: ${currentData.address}
- Phone: ${currentData.phone}
- Website: ${currentData.website}
- Entity Type: ${currentData.entityType}
- Categories: ${currentData.categories || "(none)"}
- Tags: ${currentData.tags || "(none)"}
- Hours: ${formatValue(currentData.hours)}
- Social Media: ${formatValue(currentData.socialMedia)}
- Name Translations: ${formatValue(currentData.nameTranslations)}
- Description Translations: ${formatValue(currentData.descriptionTranslations)}
- SEO Title Translations: ${formatValue(currentData.seoTitleTranslations)}
- SEO Description Translations: ${formatValue(currentData.seoDescriptionTranslations)}

AVAILABLE OPTIONS:
- Entity Types (choose ONE): ${entityTypes}
- Categories (use slugs): ${categoryList}
- Tags (use slugs): ${tagList}

TASK:
1) Use web search to find current, official information about this entity.
2) Compare findings to the current listing.
3) Suggest updates ONLY where there is a meaningful difference or missing data.

RULES:
- Return an array of suggestions; return [] if no changes are needed.
- Each suggestion must include: field, currentValue, suggestedValue, reasoning, confidence (high|medium|low).
- Use categorySlugs/tagSlugs when suggesting category/tag changes.
- Keep descriptions concise and factual.
- **GYMS & CLASS SCHEDULES:** For gyms, yoga studios, martial arts schools, or any entity with a class-based schedule:
  1. Do NOT suggest updates to the "hours" field (keep it null or as-is).
  2. In the "description" field, include mentions of the types of classes offered.
  3. ALWAYS append a note to the "description" like "Visit website or contact directly for current class schedules and specific hours."
- Do NOT invent data; prefer omitting a suggestion if unsure.
- Fields you may update: name, description, address, phone, website, entityType, categorySlugs, tagSlugs, hours, socialMedia, nameTranslations, descriptionTranslations, seoTitleTranslations, seoDescriptionTranslations.
- Use full street addresses for address when available; otherwise leave as null/omitted.

Return ONLY JSON array in this exact shape:
[
  {
    "field": "phone",
    "currentValue": "(916) 555-0100",
    "suggestedValue": "(916) 555-0199",
    "reasoning": "Updated phone number on official website (checked today)",
    "confidence": "high"
  }
]`;

  const openai = getOpenAIClient();
  const response = await openai.responses.create({
    model: "gpt-5-nano",
    input: prompt,
    tools: [{ type: "web_search" }],
    store: false,
  });

  try {
    const outputText = response.output_text.trim();
    const jsonMatch = outputText.match(/\[[\s\S]*\]/);
    const jsonText = jsonMatch ? jsonMatch[0] : outputText;
    const parsed = JSON.parse(jsonText) as EntityUpdateSuggestion[];

    return (parsed || []).map((s) => ({
      ...s,
      accepted: false,
    }));
  } catch (error) {
    console.error("Failed to parse AI response for update suggestions:", error);
    console.error("Raw output:", response.output_text);
    throw new Error("AI returned invalid JSON response");
  }
}

