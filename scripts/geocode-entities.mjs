import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Geocode using Nominatim (OpenStreetMap) - free, no API key needed
async function geocodeAddress(address) {
  try {
    // Skip PO Boxes
    if (address.includes('PO Box') || address.includes('P.O. Box')) {
      console.log(`⚠ Skipping PO Box: ${address}`);
      return null;
    }

    const encodedAddress = encodeURIComponent(address);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'TahOakParkCollective/1.0' // Required by Nominatim
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Error geocoding ${address}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('Geocoding entity addresses...\n');

  const entities = await prisma.entity.findMany({
    where: {
      address: { not: null },
      latitude: null, // Only geocode entities without lat/long
      longitude: null,
    },
  });

  console.log(`Found ${entities.length} entities to geocode\n`);

  let geocoded = 0;
  let skipped = 0;
  let failed = 0;

  for (const entity of entities) {
    console.log(`Geocoding: ${entity.name} - ${entity.address}`);
    
    const coords = await geocodeAddress(entity.address);
    
    if (coords) {
      await prisma.entity.update({
        where: { id: entity.id },
        data: {
          latitude: coords.latitude,
          longitude: coords.longitude,
        },
      });
      console.log(`✓ Geocoded: ${coords.latitude}, ${coords.longitude}\n`);
      geocoded++;
    } else {
      console.log(`⚠ Could not geocode\n`);
      skipped++;
    }

    // Be nice to Nominatim - rate limit: 1 request per second
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`\nDone!`);
  console.log(`✓ Geocoded: ${geocoded}`);
  console.log(`⚠ Skipped/Failed: ${skipped}`);
  console.log(`Total processed: ${entities.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

