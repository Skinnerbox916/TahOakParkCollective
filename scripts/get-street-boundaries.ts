// Script to get street geometries from OpenStreetMap Overpass API
// This will help us create a polygon that follows the actual street paths

async function getStreetGeometry(streetName: string, bbox: string) {
  // Overpass API query to get street geometries
  const query = `
    [out:json][timeout:25];
    (
      way["name"~"${streetName}"]({{bbox}});
    );
    out geom;
  `.replace('{{bbox}}', bbox);

  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.elements || [];
  } catch (error) {
    console.error(`Error fetching ${streetName}:`, error);
    return [];
  }
}

// Bounding box for Sacramento area (approximate)
const bbox = '38.45,-121.55,38.65,-121.40';

async function main() {
  console.log('Fetching street geometries from OpenStreetMap...\n');

  const streets = [
    'US 50',
    'Highway 50', 
    'Fruitridge',
    'US 99',
    'Highway 99',
    '65th Street',
    '65th St'
  ];

  for (const street of streets) {
    console.log(`Fetching: ${street}`);
    const geometries = await getStreetGeometry(street, bbox);
    console.log(`Found ${geometries.length} segments\n`);
    
    if (geometries.length > 0) {
      geometries.forEach((way: any, i: number) => {
        if (way.geometry) {
          console.log(`Segment ${i + 1}: ${way.geometry.length} points`);
          // Print first few coordinates
          way.geometry.slice(0, 3).forEach((point: any) => {
            console.log(`  [${point.lat}, ${point.lon}]`);
          });
        }
      });
    }
    console.log('\n');
    
    // Rate limit
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

main().catch(console.error);

