import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient();

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
  };
  return mapping[jsonType] || 'COMMERCE';
}

// Map category name to category slug
const categoryNameToSlug = {
  'Elected Official': 'elected-official',
  'Government Office': 'government-office',
  'Neighborhood Association': 'neighborhood-association',
  'Business Improvement District': 'business-improvement-district',
  'Community Group': 'community-group',
  'Park': 'park',
  'Library': 'library',
  'Community Center': 'community-center',
  'Social Services': 'social-services',
  'Community Health': 'community-health',
  'Education': 'education',
  'Spiritual': 'spiritual',
};

async function main() {
  console.log('Importing entities...');
  
  // Read JSON file
  const jsonPath = join(__dirname, '..', 'entity_load.json');
  const entitiesData = JSON.parse(readFileSync(jsonPath, 'utf-8'));
  
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
    console.log('✓ Created system user');
  }
  
  // Import each entity
  for (const entityData of entitiesData) {
    const slug = slugify(entityData.name);
    const entityType = mapEntityType(entityData.entity_type);
    
    // Find category by name
    const categorySlug = categoryNameToSlug[entityData.category];
    let category = null;
    if (categorySlug) {
      category = await prisma.category.findUnique({
        where: { slug: categorySlug },
      });
    }
    
    // Check if entity already exists
    const existing = await prisma.entity.findUnique({
      where: { slug },
    });
    
    if (existing) {
      console.log(`⚠ Entity already exists: ${entityData.name}`);
      continue;
    }
    
    // Create entity
    await prisma.entity.create({
      data: {
        name: entityData.name,
        slug,
        description: entityData.notes || null,
        address: entityData.address || null,
        phone: null,
        website: null,
        latitude: null, // PO Boxes can't be geocoded
        longitude: null,
        categoryId: category?.id || null,
        entityType,
        status: 'ACTIVE',
        featured: false,
        ownerId: systemUser.id,
      },
    });
    
    console.log(`✓ Imported: ${entityData.name} (${entityType})`);
  }
  
  console.log('Entities imported successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

