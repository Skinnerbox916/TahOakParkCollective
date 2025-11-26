import { Role, BusinessStatus, EntityType, TagCategory } from "@prisma/client";
import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/password";

const DEFAULT_CATEGORIES = [
  { name: "Restaurants", slug: "restaurants", description: "Dining establishments" },
  { name: "Retail", slug: "retail", description: "Retail shops and stores" },
  { name: "Services", slug: "services", description: "Professional and personal services" },
  { name: "Entertainment", slug: "entertainment", description: "Entertainment venues" },
  { name: "Healthcare", slug: "healthcare", description: "Healthcare providers" },
  { name: "Education", slug: "education", description: "Educational institutions" },
  { name: "Automotive", slug: "automotive", description: "Auto services and dealerships" },
  { name: "Home & Garden", slug: "home-garden", description: "Home improvement and garden centers" },
];

const INITIAL_TAGS = [
  // Identity
  { name: "Black-owned", category: TagCategory.IDENTITY },
  { name: "LGBTQ-owned", category: TagCategory.IDENTITY },
  { name: "Women-owned", category: TagCategory.IDENTITY },
  { name: "Veteran-owned", category: TagCategory.IDENTITY },
  { name: "Family-owned", category: TagCategory.IDENTITY },
  { name: "Asian-owned", category: TagCategory.IDENTITY },
  { name: "Latinx-owned", category: TagCategory.IDENTITY },
  { name: "Indigenous-owned", category: TagCategory.IDENTITY },
  
  // Friendliness
  { name: "Kid-friendly", category: TagCategory.FRIENDLINESS },
  { name: "Dog-friendly", category: TagCategory.FRIENDLINESS },
  { name: "Neurodiversity-friendly", category: TagCategory.FRIENDLINESS },
  { name: "Wheelchair-accessible", category: TagCategory.FRIENDLINESS },
  { name: "Senior-friendly", category: TagCategory.FRIENDLINESS },
  { name: "Sensory-friendly", category: TagCategory.FRIENDLINESS },
  
  // Amenities
  { name: "WiFi", category: TagCategory.AMENITY },
  { name: "Outdoor Seating", category: TagCategory.AMENITY },
  { name: "Parking Available", category: TagCategory.AMENITY },
  { name: "Public Restroom", category: TagCategory.AMENITY },
  { name: "Accepts Cash", category: TagCategory.AMENITY },
  { name: "Accepts Cards", category: TagCategory.AMENITY },
  { name: "Gender-neutral Restrooms", category: TagCategory.AMENITY },
  { name: "Changing Tables", category: TagCategory.AMENITY },
];

async function main() {
  console.log("Starting seed...");

  // Create categories
  console.log("Creating categories...");
  const categories = await Promise.all(
    DEFAULT_CATEGORIES.map((cat) =>
      prisma.category.upsert({
        where: { slug: cat.slug },
        update: {},
        create: {
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
        },
      })
    )
  );
  console.log(`Created ${categories.length} categories`);

  // Create tags
  console.log("Creating tags...");
  for (const tag of INITIAL_TAGS) {
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
  console.log(`Created ${INITIAL_TAGS.length} tags`);

  // Create admin user
  console.log("Creating admin user...");
  const adminPassword = await hashPassword("password123");
  const admin = await prisma.user.upsert({
    where: { email: "admin@tahoak.com" },
    update: {
      password: adminPassword, // Update password if user exists
      roles: [Role.USER, Role.ADMIN], // Ensure roles array is set
    },
    create: {
      email: "admin@tahoak.com",
      name: "Admin User",
      roles: [Role.USER, Role.ADMIN],
      password: adminPassword,
    },
  });
  console.log("Admin user created:", admin.email);

  // Create business owner user
  console.log("Creating business owner user...");
  const ownerPassword = await hashPassword("owner123");
  const businessOwner = await prisma.user.upsert({
    where: { email: "owner@tahoak.com" },
    update: {
      password: ownerPassword, // Update password if user exists
      roles: [Role.USER, Role.BUSINESS_OWNER], // Ensure roles array is set
    },
    create: {
      email: "owner@tahoak.com",
      name: "Business Owner",
      roles: [Role.USER, Role.BUSINESS_OWNER],
      password: ownerPassword,
    },
  });
  console.log("Business owner created:", businessOwner.email);

  // Create sample entities
  console.log("Creating sample entities...");
  const restaurantsCategory = categories.find((c) => c.slug === "restaurants");
  const retailCategory = categories.find((c) => c.slug === "retail");

  if (restaurantsCategory) {
    const entity1 = await prisma.entity.upsert({
      where: { slug: "sample-restaurant-tahoe-park" },
      update: {},
      create: {
        name: "Sample Restaurant - Tahoe Park",
        slug: "sample-restaurant-tahoe-park",
        description: "A great local restaurant in Tahoe Park",
        address: "123 Main St, Sacramento, CA 95820",
        phone: "(916) 555-0100",
        website: "https://example.com",
        coverageArea: "TAHOE_PARK",
        categoryId: restaurantsCategory.id,
        entityType: EntityType.COMMERCE,
        status: BusinessStatus.ACTIVE,
        ownerId: businessOwner.id,
        latitude: 38.5384,
        longitude: -121.4614,
        hours: {
          monday: { open: "11:00", close: "22:00", closed: false },
          tuesday: { open: "11:00", close: "22:00", closed: false },
          wednesday: { open: "11:00", close: "22:00", closed: false },
          thursday: { open: "11:00", close: "22:00", closed: false },
          friday: { open: "11:00", close: "23:00", closed: false },
          saturday: { open: "11:00", close: "23:00", closed: false },
          sunday: { open: "12:00", close: "21:00", closed: false },
        },
      },
    });
    console.log("Created entity:", entity1.name);
  }

  if (retailCategory) {
    const entity2 = await prisma.entity.upsert({
      where: { slug: "sample-shop-oak-park" },
      update: {},
      create: {
        name: "Sample Shop - Oak Park",
        slug: "sample-shop-oak-park",
        description: "A local retail shop in Oak Park",
        address: "456 Broadway, Sacramento, CA 95817",
        phone: "(916) 555-0200",
        website: "https://example.com",
        coverageArea: "OAK_PARK",
        categoryId: retailCategory.id,
        entityType: EntityType.COMMERCE,
        status: BusinessStatus.PENDING,
        ownerId: businessOwner.id,
        latitude: 38.5569,
        longitude: -121.4614,
      },
    });
    console.log("Created entity:", entity2.name);
  }

  // Create entities in other areas
  if (restaurantsCategory) {
    const entity3 = await prisma.entity.upsert({
      where: { slug: "elmhurst-cafe" },
      update: {},
      create: {
        name: "Elmhurst Cafe",
        slug: "elmhurst-cafe",
        description: "Cozy cafe in Elmhurst",
        address: "789 Oak Ave, Sacramento, CA 95815",
        phone: "(916) 555-0300",
        coverageArea: "ELMHURST", // Note: Using enum-like string, although strictly we only validate OAK_PARK/TAHOE_PARK in logic usually
        categoryId: restaurantsCategory.id,
        entityType: EntityType.COMMERCE,
        status: BusinessStatus.ACTIVE,
        ownerId: businessOwner.id,
        latitude: 38.6107,
        longitude: -121.4789,
      },
    });
    console.log("Created entity:", entity3.name);
  }

  if (retailCategory) {
    const entity4 = await prisma.entity.upsert({
      where: { slug: "colonial-park-market" },
      update: {},
      create: {
        name: "Colonial Park Market",
        slug: "colonial-park-market",
        description: "Local market in Colonial Park",
        address: "321 Market St, Sacramento, CA 95819",
        phone: "(916) 555-0400",
        coverageArea: "COLONIAL_PARK",
        categoryId: retailCategory.id,
        entityType: EntityType.COMMERCE,
        status: BusinessStatus.ACTIVE,
        ownerId: businessOwner.id,
        latitude: 38.5705,
        longitude: -121.4614,
      },
    });
    console.log("Created entity:", entity4.name);
  }

  if (retailCategory) {
    const entity5 = await prisma.entity.upsert({
      where: { slug: "curtis-park-boutique" },
      update: {},
      create: {
        name: "Curtis Park Boutique",
        slug: "curtis-park-boutique",
        description: "Fashion boutique in Curtis Park",
        address: "654 Park Blvd, Sacramento, CA 95818",
        phone: "(916) 555-0500",
        coverageArea: "CURTIS_PARK",
        categoryId: retailCategory.id,
        entityType: EntityType.COMMERCE,
        status: BusinessStatus.ACTIVE,
        ownerId: businessOwner.id,
        latitude: 38.5569,
        longitude: -121.4614,
      },
    });
    console.log("Created entity:", entity5.name);
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
