import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set up Prisma with pg adapter
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Helper to generate slug from name
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Map JSON entity_type to Prisma enum
function mapEntityType(jsonType) {
  const mapping = {
    'COMMERCE': 'COMMERCE',
    'CIVIC': 'CIVIC',
    'ADVOCACY': 'ADVOCACY',
    'PUBLIC_SPACE': 'PUBLIC_SPACE',
    'NON_PROFIT': 'NON_PROFIT',
    'EVENT': 'EVENT',
    'SERVICE_PROVIDER': 'SERVICE_PROVIDER',
  };
  return mapping[jsonType] || 'COMMERCE';
}

async function main() {
  console.log('Importing entities...\n');
  
  // Read JSON file
  const jsonPath = join(__dirname, '..', 'entity_load.json');
  const entitiesData = JSON.parse(readFileSync(jsonPath, 'utf-8'));
  
  // Fetch all categories from database (source of truth)
  const allCategories = await prisma.category.findMany({
    select: { id: true, name: true, slug: true },
  });
  console.log(`Found ${allCategories.length} categories in database\n`);
  
  // Build lookup maps (by name and by slug for flexibility)
  const categoryByName = {};
  const categoryBySlug = {};
  for (const cat of allCategories) {
    categoryByName[cat.name.toLowerCase()] = cat;
    categoryBySlug[cat.slug] = cat;
  }
  
  // Get or create system user
  let systemUser = await prisma.user.findFirst({
    where: { email: 'system@tahoakparkcollective.org' },
  });
  
  if (!systemUser) {
    systemUser = await prisma.user.create({
      data: {
        name: 'System',
        email: 'system@tahoakparkcollective.org',
        roles: ['ADMIN'],
      },
    });
    console.log('✓ Created system user\n');
  }
  
  // Import each entity
  let imported = 0;
  let skipped = 0;
  
  for (const entityData of entitiesData) {
    const slug = slugify(entityData.name);
    const entityType = mapEntityType(entityData.entity_type);
    
    // Find category by name (case-insensitive) or slug
    let category = null;
    if (entityData.category) {
      const categoryName = entityData.category.toLowerCase();
      category = categoryByName[categoryName] || categoryBySlug[slugify(entityData.category)];
      
      if (!category) {
        console.log(`  ⚠ Category not found: "${entityData.category}" for ${entityData.name}`);
      }
    }
    
    // Check if entity already exists
    const existing = await prisma.entity.findUnique({
      where: { slug },
    });
    
    if (existing) {
      console.log(`  ⚠ Already exists: ${entityData.name}`);
      skipped++;
      continue;
    }
    
    // Create entity with categories (many-to-many)
    await prisma.entity.create({
      data: {
        name: entityData.name,
        slug,
        description: entityData.notes || null,
        address: entityData.address || null,
        phone: null,
        website: null,
        latitude: null,
        longitude: null,
        categories: category ? { connect: [{ id: category.id }] } : undefined,
        entityType,
        status: 'ACTIVE',
        featured: false,
        ownerId: systemUser.id,
      },
    });
    
    console.log(`  ✓ Imported: ${entityData.name} (${entityType}${category ? `, ${category.name}` : ''})`);
    imported++;
  }
  
  console.log(`\nImport complete: ${imported} imported, ${skipped} skipped`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
