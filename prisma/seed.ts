import { EntityType, TagCategory } from "../src/generated/prisma/client";
import { prisma } from "../src/lib/prisma";
import { randomBytes } from "crypto";
import { hashPassword } from "better-auth/crypto";

/**
 * A confirmed user with a password, written the way Better Auth stores it
 * (the hash lives on a "credential" account, not the user).
 */
async function createUserWithPassword(data: { email: string; name: string; role: string; password: string }) {
  const user = await prisma.user.create({
    data: { email: data.email, name: data.name, role: data.role, emailVerified: true },
  });
  await prisma.authAccount.create({
    data: {
      id: randomBytes(16).toString("hex"),
      userId: user.id,
      accountId: user.id,
      providerId: "credential",
      password: await hashPassword(data.password),
    },
  });
  return user;
}

const ADMIN_EMAIL = "admin@tahoak.com";

// =============================================================================
// CATEGORIES - The canonical list of categories for the TahOak Park Collective
// =============================================================================
// These are the 13 user-centric categories for browsing/discovery.
// Each category can be associated with multiple Entity Types.
// Categories are managed via admin UI after initial seed.
// =============================================================================

const CATEGORIES = [
  {
    name: "Food & Drink",
    slug: "food-drink",
    description: "Restaurants, cafes, bars, bakeries, food trucks, catering",
    entityTypes: [EntityType.COMMERCE],
    nameTranslations: { en: "Food & Drink", es: "Comida y Bebida" },
  },
  {
    name: "Shopping",
    slug: "shopping",
    description: "Retail stores, boutiques, markets, vintage, gifts",
    entityTypes: [EntityType.COMMERCE],
    nameTranslations: { en: "Shopping", es: "Compras" },
  },
  {
    name: "Beauty & Personal Care",
    slug: "beauty",
    description: "Hair salons, barbers, nails, tattoo, spa, estheticians",
    entityTypes: [EntityType.COMMERCE, EntityType.SERVICE_PROVIDER],
    nameTranslations: { en: "Beauty & Personal Care", es: "Belleza y Cuidado Personal" },
  },
  {
    name: "Health & Wellness",
    slug: "health-wellness",
    description: "Gyms, yoga, martial arts, massage, mental health, clinics",
    entityTypes: [EntityType.COMMERCE, EntityType.SERVICE_PROVIDER, EntityType.NON_PROFIT],
    nameTranslations: { en: "Health & Wellness", es: "Salud y Bienestar" },
  },
  {
    name: "Pets",
    slug: "pets",
    description: "Pet grooming, vets, boarding, pet stores, dog walkers",
    entityTypes: [EntityType.COMMERCE, EntityType.SERVICE_PROVIDER],
    nameTranslations: { en: "Pets", es: "Mascotas" },
  },
  {
    name: "Home & Auto",
    slug: "home-auto",
    description: "Lawn care, plumbing, electrical, cleaning, auto repair, car wash",
    entityTypes: [EntityType.COMMERCE, EntityType.SERVICE_PROVIDER],
    nameTranslations: { en: "Home & Auto", es: "Hogar y Auto" },
  },
  {
    name: "Professional Services",
    slug: "professional",
    description: "Accounting, legal, real estate, insurance, tech, photography",
    entityTypes: [EntityType.COMMERCE, EntityType.SERVICE_PROVIDER],
    nameTranslations: { en: "Professional Services", es: "Servicios Profesionales" },
  },
  {
    name: "Arts & Culture",
    slug: "arts-culture",
    description: "Galleries, music venues, comedy, dance, theater, art classes",
    entityTypes: [EntityType.COMMERCE, EntityType.NON_PROFIT, EntityType.EVENT],
    nameTranslations: { en: "Arts & Culture", es: "Arte y Cultura" },
  },
  {
    name: "Kids & Education",
    slug: "kids-education",
    description: "Schools, tutoring, daycare, camps, kids activities, youth sports",
    entityTypes: [EntityType.CIVIC, EntityType.COMMERCE, EntityType.NON_PROFIT],
    nameTranslations: { en: "Kids & Education", es: "Niños y Educación" },
  },
  {
    name: "Community & Faith",
    slug: "community-faith",
    description: "Neighborhood groups, non-profits, churches, temples, mutual aid",
    entityTypes: [EntityType.NON_PROFIT],
    nameTranslations: { en: "Community & Faith", es: "Comunidad y Fe" },
  },
  {
    name: "Social Services",
    slug: "social-services",
    description: "Food banks, health clinics, homeless services, job training",
    entityTypes: [EntityType.NON_PROFIT],
    nameTranslations: { en: "Social Services", es: "Servicios Sociales" },
  },
  {
    name: "Government",
    slug: "government",
    description: "Elected officials, city offices, public services",
    entityTypes: [EntityType.CIVIC],
    nameTranslations: { en: "Government", es: "Gobierno" },
  },
  {
    name: "Parks",
    slug: "parks",
    description: "Parks, gardens, plazas, outdoor recreation spaces",
    entityTypes: [EntityType.PUBLIC_SPACE],
    nameTranslations: { en: "Parks", es: "Parques" },
  },
];

// =============================================================================
// TAGS - Identity, Friendliness, and Amenity tags
// =============================================================================

const TAGS = [
  // Identity (owner-assigned)
  { name: "Black-owned", es: "De propiedad afroamericana", category: TagCategory.IDENTITY },
  { name: "LGBTQ-owned", es: "De propiedad LGBTQ", category: TagCategory.IDENTITY },
  { name: "Women-owned", es: "De propiedad de mujeres", category: TagCategory.IDENTITY },
  { name: "Veteran-owned", es: "De propiedad de veteranos", category: TagCategory.IDENTITY },
  { name: "Asian-owned", es: "De propiedad asiática", category: TagCategory.IDENTITY },
  { name: "Latinx-owned", es: "De propiedad latina", category: TagCategory.IDENTITY },
  { name: "Indigenous-owned", es: "De propiedad indígena", category: TagCategory.IDENTITY },
  { name: "Immigrant-owned", es: "De propiedad inmigrante", category: TagCategory.IDENTITY },

  // Friendliness (admin-verified)
  { name: "Kid-friendly", es: "Apto para niños", category: TagCategory.FRIENDLINESS },
  { name: "Dog-friendly", es: "Se admiten perros", category: TagCategory.FRIENDLINESS },
  { name: "Neurodiversity-friendly", es: "Inclusivo con la neurodiversidad", category: TagCategory.FRIENDLINESS },
  { name: "Wheelchair-accessible", es: "Accesible en silla de ruedas", category: TagCategory.FRIENDLINESS },
  { name: "Senior-friendly", es: "Apto para personas mayores", category: TagCategory.FRIENDLINESS },
  { name: "Sensory-friendly", es: "Adaptado a sensibilidades sensoriales", category: TagCategory.FRIENDLINESS },
  { name: "Spanish Speaking", es: "Se habla español", category: TagCategory.FRIENDLINESS },

  // Amenities (open)
  { name: "WiFi", es: "Wifi", category: TagCategory.AMENITY },
  { name: "Outdoor Seating", es: "Mesas al aire libre", category: TagCategory.AMENITY },
  { name: "Parking Available", es: "Estacionamiento disponible", category: TagCategory.AMENITY },
  { name: "Public Restroom", es: "Baño público", category: TagCategory.AMENITY },
  { name: "Accepts Cash", es: "Acepta efectivo", category: TagCategory.AMENITY },
  { name: "Accepts Cards", es: "Acepta tarjetas", category: TagCategory.AMENITY },
  { name: "Gender-neutral Restrooms", es: "Baños de género neutro", category: TagCategory.AMENITY },
  { name: "Changing Tables", es: "Cambiador de pañales", category: TagCategory.AMENITY },
];

// =============================================================================
// SEED FUNCTION
// =============================================================================

async function main() {
  console.log("Starting seed...\n");

  // -------------------------------------------------------------------------
  // Create Categories
  // -------------------------------------------------------------------------
  console.log("Creating categories...");
  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        entityTypes: cat.entityTypes,
        nameTranslations: cat.nameTranslations,
      },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        entityTypes: cat.entityTypes,
        nameTranslations: cat.nameTranslations,
      },
    });
    console.log(`  ✓ ${cat.name}`);
  }
  console.log(`Created ${CATEGORIES.length} categories\n`);

  // -------------------------------------------------------------------------
  // Create Tags
  // -------------------------------------------------------------------------
  console.log("Creating tags...");
  for (const tag of TAGS) {
    const slug = tag.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    await prisma.tag.upsert({
      where: { slug },
      update: {}, // never overwrite an admin's edits
      create: {
        name: tag.name,
        nameTranslations: { en: tag.name, es: tag.es },
        slug,
        category: tag.category,
      },
    });
  }
  console.log(`Created ${TAGS.length} tags\n`);

  // -------------------------------------------------------------------------
  // Create Admin User
  // -------------------------------------------------------------------------
  // Created only if missing — an existing admin's password is never touched,
  // so re-running the seed against production can't reset credentials.
  console.log("Creating admin user...");
  const existingAdmin = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
    select: { id: true },
  });
  if (existingAdmin) {
    console.log(`  - ${ADMIN_EMAIL} already exists, leaving it unchanged\n`);
  } else {
    const envPassword = process.env.SEED_ADMIN_PASSWORD;
    const adminPassword = envPassword || randomBytes(18).toString("base64url");
    await createUserWithPassword({ email: ADMIN_EMAIL, name: "Admin User", role: "admin", password: adminPassword });
    console.log(`  ✓ ${ADMIN_EMAIL}`);
    if (!envPassword) {
      console.log(`    Generated password (shown once): ${adminPassword}`);
    }
    console.log();
  }

  // -------------------------------------------------------------------------
  // Create Business Owner User (local development only)
  // -------------------------------------------------------------------------
  if (process.env.SEED_TEST_USERS === "true") {
    console.log("Creating test business owner user...");
    if (!(await prisma.user.findUnique({ where: { email: "owner@tahoak.com" }, select: { id: true } }))) {
      await createUserWithPassword({ email: "owner@tahoak.com", name: "Business Owner", role: "user", password: "owner123" });
    }
    console.log("  ✓ owner@tahoak.com\n");
  }

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
