/**
 * Machine translation on save. A listing's description gets a Spanish
 * translation (DeepL) when the English one is new or changed and nobody wrote
 * a Spanish one. Names are proper nouns and stay as they are; display falls
 * back to the English name.
 *
 * Only with a real DEEPL_API_KEY: in development without one, the mock
 * provider would store "[ES] ..." text. A failed translation is logged and the
 * save goes ahead without Spanish.
 */
import { getTranslationService } from "@/lib/translate";
import type { EntityChanges, EntityState } from "./fields";

export function autoTranslateEnabled(): boolean {
  return !!process.env.DEEPL_API_KEY;
}

/** `changes` plus a Spanish description where one is missing. `current` is the listing for updates. */
export async function withSpanishDescription(changes: EntityChanges, current?: EntityState): Promise<EntityChanges> {
  const english = changes.description;
  if (!autoTranslateEnabled() || !english) return changes;
  if (current && english === current.description) return changes; // unchanged: don't re-translate
  const translations =
    changes.descriptionTranslations !== undefined ? changes.descriptionTranslations : current?.descriptionTranslations;
  if (translations?.es) return changes;

  const spanish = await getTranslationService().tryTranslate(english, "es", "en");
  if (!spanish) return changes;
  return { ...changes, descriptionTranslations: { ...(translations ?? {}), es: spanish } };
}
