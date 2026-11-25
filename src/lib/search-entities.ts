/**
 * Free-text listing search, in English and Spanish, ignoring case and accents.
 *
 * Every word in the query has to match somewhere: the listing's name or
 * description (English or Spanish), its address (admin search only), or the
 * English or Spanish name of one of its categories or tags. So "cafe" finds
 * "Café", "comida" finds listings in the "Comida y Bebida" category, and
 * "pizza oak" needs both words. Categories and tags come from the database,
 * never from a hardcoded synonym list.
 */
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const MAX_TERMS = 6;

// Accent folding that works in any database locale (lower() alone may not
// fold non-ASCII capitals, so the capitals are listed too).
const ACCENTED = "áàäâéèëêíìïîóòöôúùüûñçÁÀÄÂÉÈËÊÍÌÏÎÓÒÖÔÚÙÜÛÑÇ";
const PLAIN = "aaaaeeeeiiiioooouuuuncaaaaeeeeiiiioooouuuunc";

/** Fold a column expression in SQL: lower case, accents removed. */
const fold = (expr: string) => Prisma.raw(`translate(lower(coalesce(${expr}, '')), '${ACCENTED}', '${PLAIN}')`);

/** Fold a query word the same way, and escape LIKE wildcards. */
function foldTerm(term: string) {
  return term
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[\\%_]/g, (c) => `\\${c}`);
}

export function searchTerms(query: string): string[] {
  return query
    .split(/\s+/)
    .map(foldTerm)
    .filter(Boolean)
    .slice(0, MAX_TERMS);
}

/** IDs of listings matching every word of `query`. Status and other filters are the caller's. */
export async function searchEntityIds(query: string, opts: { includeAddress?: boolean } = {}): Promise<string[]> {
  const terms = searchTerms(query);
  if (terms.length === 0) return [];

  const conditions = terms.map((term) => {
    const like = `%${term}%`;
    return Prisma.sql`(
      ${fold(`e."name"`)} LIKE ${like}
      OR ${fold(`e."description"`)} LIKE ${like}
      OR ${fold(`e."nameTranslations"->>'es'`)} LIKE ${like}
      OR ${fold(`e."descriptionTranslations"->>'es'`)} LIKE ${like}
      ${opts.includeAddress ? Prisma.sql`OR ${fold(`e."address"`)} LIKE ${like}` : Prisma.empty}
      OR EXISTS (
        SELECT 1 FROM "_CategoryToEntity" ce JOIN "Category" c ON c."id" = ce."A"
        WHERE ce."B" = e."id"
          AND (${fold(`c."name"`)} LIKE ${like} OR ${fold(`c."nameTranslations"->>'es'`)} LIKE ${like})
      )
      OR EXISTS (
        SELECT 1 FROM "EntityTag" et JOIN "Tag" t ON t."id" = et."tagId"
        WHERE et."entityId" = e."id"
          AND (${fold(`t."name"`)} LIKE ${like} OR ${fold(`t."nameTranslations"->>'es'`)} LIKE ${like})
      )
    )`;
  });

  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT e."id" FROM "Entity" e WHERE ${Prisma.join(conditions, " AND ")}
  `;
  return rows.map((row) => row.id);
}
