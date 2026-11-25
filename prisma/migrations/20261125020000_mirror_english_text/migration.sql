-- "name" and "description" are the English text. Their translations keep the
-- other languages, with "en" mirroring the plain field; with no other
-- language they're NULL. This matches mirrorEnglish() in
-- src/lib/entities/fields.ts, which applies the rule to every write from now on.

CREATE FUNCTION pg_temp.mirror_english(translations jsonb, english text) RETURNS jsonb AS $$
  SELECT CASE
    WHEN others IS NULL THEN NULL
    WHEN english IS NULL OR english = '' THEN others
    ELSE others || jsonb_build_object('en', english)
  END
  FROM (
    SELECT jsonb_object_agg(key, value) AS others
    FROM jsonb_each(CASE WHEN jsonb_typeof(translations) = 'object' THEN translations ELSE '{}'::jsonb END)
    WHERE key <> 'en' AND jsonb_typeof(value) = 'string' AND btrim(value #>> '{}') <> ''
  ) o
$$ LANGUAGE sql IMMUTABLE;

UPDATE "Entity"
SET "nameTranslations" = pg_temp.mirror_english("nameTranslations", "name"),
    "descriptionTranslations" = pg_temp.mirror_english("descriptionTranslations", "description"),
    "version" = "version" + 1,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "nameTranslations" IS DISTINCT FROM pg_temp.mirror_english("nameTranslations", "name")
   OR "descriptionTranslations" IS DISTINCT FROM pg_temp.mirror_english("descriptionTranslations", "description");
