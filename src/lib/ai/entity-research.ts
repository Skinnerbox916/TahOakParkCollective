import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { ENTITY_TYPE } from "@/lib/prismaEnums";
import { getExistingEntitiesForComparison } from "./get-existing-entities";

// Lazy initialization of OpenAI client to avoid errors at module load time
function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set. Please configure it in your environment.");
  }
  return new OpenAI({ apiKey });
}

export interface EntityResearchResult {
  name: string;
  description: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  entityType: string;
  categorySlugs: string[];
  tagSlugs?: string[];
  hours: any | null;
  socialMedia: any | null;
  nameTranslations?: { en: string; es: string } | null;
  descriptionTranslations?: { en: string; es: string } | null;
  duplicateCheck: {
    isDuplicate: boolean;
    existingEntityName?: string;
    confidence?: string;
  };
  needsCategoryGuidance?: boolean;
}

/**
 * Research an entity using AI and check for duplicates
 */
export async function researchEntity(
  entityName: string
): Promise<EntityResearchResult> {
  // Fetch categories and tags from database
  const categories = await prisma.category.findMany({
    select: {
      name: true,
      slug: true,
      entityTypes: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  const tags = await prisma.tag.findMany({
    select: {
      name: true,
      slug: true,
      category: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  // Fetch existing entities for duplicate comparison
  const existingEntities = await getExistingEntitiesForComparison();

  // Build category list for prompt
  const categoryList = categories
    .map((cat) => `${cat.name} (slug: ${cat.slug})`)
    .join(", ");

  // Build tag list for prompt
  const tagList = tags.map((tag) => `${tag.name} (slug: ${tag.slug})`).join(", ");

  // Format existing entities for prompt
  const existingEntitiesList = existingEntities
    .map((entity) => {
      const parts: string[] = [`Name: ${entity.name}`];
      if (entity.address) parts.push(`Address: ${entity.address}`);
      if (entity.website) parts.push(`Website: ${entity.website}`);
      return `- ${parts.join(", ")}`;
    })
    .join("\n");

  const entityTypes = Object.values(ENTITY_TYPE).join(", ");

  const locationContext = " Location context: Sacramento, CA (Tahoe Park, Oak Park, Elmhurst, Colonial Park, Curtis Park neighborhoods). Assume the entity is in the coverage area.";

  // Build comprehensive prompt based on runbook
  const prompt = `You are researching entities for TahOak Park Collective, a hyper-local business directory for Sacramento neighborhoods (Tahoe Park, Oak Park, Elmhurst, Colonial Park, Curtis Park).

Research this entity: "${entityName}"${locationContext}

Follow these steps:
1. Use web search to find the official entity information
2. Gather all relevant data (name, description, address, phone, website, etc.)
3. Compare against existing entities list to check for duplicates
4. Determine entity type, categories, and tags

Entity Types (choose ONE): ${entityTypes}

Available Categories (use slugs): ${categoryList}

Available Tags (use slugs): ${tagList}

Existing Entities in Database (for duplicate checking):
${existingEntitiesList || "(No existing entities)"}

CRITICAL INSTRUCTIONS:
- Use the OFFICIAL name from your research, not the user-provided name
- **ADDRESS REQUIREMENTS:**
  * **REQUIRED for:** COMMERCE (storefronts, retail), PUBLIC_SPACE (parks, community centers), NON_PROFIT (churches, organizations with physical locations, neighborhood associations, community groups)
  * **OPTIONAL for:** SERVICE_PROVIDER (home-based services, freelancers - use null if no physical location), CIVIC (elected officials may not have locations), EVENT (may vary by occurrence)
  * **ADDRESS FORMAT:** If providing an address, it MUST be a full street address in format "123 Main Street, Sacramento, CA 95820" (NOT just the business name)
  * **QUALITY STANDARD:** Only return an address if you found a complete, verifiable street address. Do not guess or use incomplete addresses. If you cannot find a proper street address for an entity that requires one, this indicates incomplete research.
- For entity type PUBLIC_SPACE or CIVIC, set hours to null (hours not displayed for these types)
- For gyms, dance studios, yoga studios, fitness classes: skip hours and note in description "Visit website for current class schedules and hours"
- Compare the researched entity against existing entities list above
- Determine if it's a duplicate based on name similarity, address matching, website matching, or overall entity identity
- Only mark as duplicate if you are confident it's the same entity
- If uncertain, err on the side of NOT being a duplicate
- If entity doesn't fit existing categories, set needsCategoryGuidance: true

Return valid JSON in this exact format:
{
  "name": "Official Name",
  "description": "2-3 sentence description",
  "address": "Full street address (e.g., '123 Main St, Sacramento, CA 95820') or null if not found",
  "phone": "Phone number or null",
  "website": "URL or null",
  "entityType": "ENTITY_TYPE",
  "categorySlugs": ["category-slug1", "category-slug2"],
  "tagSlugs": ["tag-slug1", "tag-slug2"],
  "hours": {"monday": {"open": "09:00", "close": "17:00", "closed": false}, "tuesday": {...}, ...} or null,
  "socialMedia": {"facebook": "url", "instagram": "url"} or null,
  "nameTranslations": {"en": "English name", "es": "Spanish name"} or null,
  "descriptionTranslations": {"en": "English description", "es": "Spanish description"} or null,
  "duplicateCheck": {
    "isDuplicate": false,
    "existingEntityName": "Name of existing entity if duplicate" or null,
    "confidence": "high" | "medium" | "low"
  },
  "needsCategoryGuidance": false
}`;

  // Call OpenAI Responses API
  const openai = getOpenAIClient();
  const response = await openai.responses.create({
    model: "gpt-5-nano",
    input: prompt,
    tools: [{ type: "web_search" }],
    store: false,
  });

  // Parse JSON from response
  let result: EntityResearchResult;
  try {
    const outputText = response.output_text.trim();
    // Try to extract JSON if there's extra text
    const jsonMatch = outputText.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch ? jsonMatch[0] : outputText;
    result = JSON.parse(jsonText);
  } catch (error) {
    console.error("Failed to parse AI response:", error);
    console.error("Raw output:", response.output_text);
    throw new Error("AI returned invalid JSON response");
  }

  // Validate required fields
  if (!result.name || !result.description || !result.entityType) {
    throw new Error("AI response missing required fields (name, description, entityType)");
  }

  // Ensure duplicateCheck exists
  if (!result.duplicateCheck) {
    result.duplicateCheck = {
      isDuplicate: false,
    };
  }

  return result;
}

