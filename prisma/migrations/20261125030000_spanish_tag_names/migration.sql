-- Spanish names for the standard tags (the same ones prisma/seed.ts creates).
-- Only fills tags that have no Spanish yet, so admin edits are never replaced.
-- Tags not in this list are left alone; admins add Spanish on the Tags page.
UPDATE "Tag" t
SET "nameTranslations" = jsonb_build_object('en', t."name", 'es', v.es),
    "updatedAt" = CURRENT_TIMESTAMP
FROM (VALUES
  ('black-owned', 'De propiedad afroamericana'),
  ('lgbtq-owned', 'De propiedad LGBTQ'),
  ('women-owned', 'De propiedad de mujeres'),
  ('veteran-owned', 'De propiedad de veteranos'),
  ('asian-owned', 'De propiedad asiática'),
  ('latinx-owned', 'De propiedad latina'),
  ('indigenous-owned', 'De propiedad indígena'),
  ('immigrant-owned', 'De propiedad inmigrante'),
  ('kid-friendly', 'Apto para niños'),
  ('dog-friendly', 'Se admiten perros'),
  ('neurodiversity-friendly', 'Inclusivo con la neurodiversidad'),
  ('wheelchair-accessible', 'Accesible en silla de ruedas'),
  ('senior-friendly', 'Apto para personas mayores'),
  ('sensory-friendly', 'Adaptado a sensibilidades sensoriales'),
  ('spanish-speaking', 'Se habla español'),
  ('wifi', 'Wifi'),
  ('outdoor-seating', 'Mesas al aire libre'),
  ('parking-available', 'Estacionamiento disponible'),
  ('public-restroom', 'Baño público'),
  ('accepts-cash', 'Acepta efectivo'),
  ('accepts-cards', 'Acepta tarjetas'),
  ('gender-neutral-restrooms', 'Baños de género neutro'),
  ('changing-tables', 'Cambiador de pañales')
) AS v(slug, es)
WHERE t."slug" = v.slug
  AND (t."nameTranslations" IS NULL
       OR jsonb_typeof(t."nameTranslations") <> 'object'
       OR coalesce(t."nameTranslations"->>'es', '') = '');
