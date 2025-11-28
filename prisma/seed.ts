import { Role, BusinessStatus, EntityType, TagCategory } from "@prisma/client";
import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/password";

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
    entityTypes: [EntityType.ADVOCACY, EntityType.NON_PROFIT],
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
  { name: "Black-owned", category: TagCategory.IDENTITY },
  { name: "LGBTQ-owned", category: TagCategory.IDENTITY },
  { name: "Women-owned", category: TagCategory.IDENTITY },
  { name: "Veteran-owned", category: TagCategory.IDENTITY },
  { name: "Asian-owned", category: TagCategory.IDENTITY },
  { name: "Latinx-owned", category: TagCategory.IDENTITY },
  { name: "Indigenous-owned", category: TagCategory.IDENTITY },
  
  // Friendliness (admin-verified)
  { name: "Kid-friendly", category: TagCategory.FRIENDLINESS },
  { name: "Dog-friendly", category: TagCategory.FRIENDLINESS },
  { name: "Neurodiversity-friendly", category: TagCategory.FRIENDLINESS },
  { name: "Wheelchair-accessible", category: TagCategory.FRIENDLINESS },
  { name: "Senior-friendly", category: TagCategory.FRIENDLINESS },
  { name: "Sensory-friendly", category: TagCategory.FRIENDLINESS },
  
  // Amenities (open)
  { name: "WiFi", category: TagCategory.AMENITY },
  { name: "Outdoor Seating", category: TagCategory.AMENITY },
  { name: "Parking Available", category: TagCategory.AMENITY },
  { name: "Public Restroom", category: TagCategory.AMENITY },
  { name: "Accepts Cash", category: TagCategory.AMENITY },
  { name: "Accepts Cards", category: TagCategory.AMENITY },
  { name: "Gender-neutral Restrooms", category: TagCategory.AMENITY },
  { name: "Changing Tables", category: TagCategory.AMENITY },
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
      update: {},
      create: {
        name: tag.name,
        slug,
        category: tag.category,
      },
    });
  }
  console.log(`Created ${TAGS.length} tags\n`);

  // -------------------------------------------------------------------------
  // Create Admin User
  // -------------------------------------------------------------------------
  console.log("Creating admin user...");
  const adminPassword = await hashPassword("password123");
  const admin = await prisma.user.upsert({
    where: { email: "admin@tahoak.com" },
    update: {
      password: adminPassword,
      roles: [Role.USER, Role.ADMIN],
    },
    create: {
      email: "admin@tahoak.com",
      name: "Admin User",
      roles: [Role.USER, Role.ADMIN],
      password: adminPassword,
    },
  });
  console.log(`  ✓ ${admin.email}\n`);

  // -------------------------------------------------------------------------
  // Create Business Owner User (for development/testing)
  // -------------------------------------------------------------------------
  console.log("Creating business owner user...");
  const ownerPassword = await hashPassword("owner123");
  const businessOwner = await prisma.user.upsert({
    where: { email: "owner@tahoak.com" },
    update: {
      password: ownerPassword,
      roles: [Role.USER, Role.BUSINESS_OWNER],
    },
    create: {
      email: "owner@tahoak.com",
      name: "Business Owner",
      roles: [Role.USER, Role.BUSINESS_OWNER],
      password: ownerPassword,
    },
  });
  console.log(`  ✓ ${businessOwner.email}\n`);

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
