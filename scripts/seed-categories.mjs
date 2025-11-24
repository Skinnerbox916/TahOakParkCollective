import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
  // COMMERCE categories
  { name: 'Food & Drink', slug: 'food-drink', entityTypes: ['COMMERCE'] },
  { name: 'Retail', slug: 'retail', entityTypes: ['COMMERCE'] },
  { name: 'Services', slug: 'services', entityTypes: ['COMMERCE'] },
  { name: 'Health & Wellness', slug: 'health-wellness', entityTypes: ['COMMERCE'] },
  { name: 'Entertainment', slug: 'entertainment', entityTypes: ['COMMERCE'] },
  
  // CIVIC categories
  { name: 'Elected Official', slug: 'elected-official', entityTypes: ['CIVIC'] },
  { name: 'Government Office', slug: 'government-office', entityTypes: ['CIVIC'] },
  
  // ADVOCACY categories
  { name: 'Neighborhood Association', slug: 'neighborhood-association', entityTypes: ['ADVOCACY'] },
  { name: 'Business Improvement District', slug: 'business-improvement-district', entityTypes: ['ADVOCACY'] },
  { name: 'Community Group', slug: 'community-group', entityTypes: ['ADVOCACY'] },
  
  // PUBLIC_SPACE categories
  { name: 'Park', slug: 'park', entityTypes: ['PUBLIC_SPACE'] },
  { name: 'Library', slug: 'library', entityTypes: ['PUBLIC_SPACE'] },
  { name: 'Community Center', slug: 'community-center', entityTypes: ['PUBLIC_SPACE'] },
  
  // NON_PROFIT categories
  { name: 'Social Services', slug: 'social-services', entityTypes: ['NON_PROFIT'] },
  { name: 'Community Health', slug: 'community-health', entityTypes: ['NON_PROFIT'] },
  { name: 'Education', slug: 'education', entityTypes: ['NON_PROFIT'] },
  { name: 'Spiritual', slug: 'spiritual', entityTypes: ['NON_PROFIT'] },
];

async function main() {
  console.log('Seeding categories...');
  
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        entityTypes: category.entityTypes,
      },
      create: {
        name: category.name,
        slug: category.slug,
        entityTypes: category.entityTypes,
      },
    });
    console.log(`✓ Created/updated category: ${category.name}`);
  }
  
  console.log('Categories seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

