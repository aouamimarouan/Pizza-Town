import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Scanning for duplicate pastas...');
  
  // Fetch all pastas
  const pastas = await prisma.menuitems.findMany({
    where: { category: 'Pastas' }
  });

  const seen = new Set();
  const duplicates = [];

  for (const pasta of pastas) {
    const identifier = pasta.name.toLowerCase().trim();
    if (seen.has(identifier)) {
      duplicates.push(pasta.item_id);
    } else {
      seen.add(identifier);
    }
  }

  if (duplicates.length === 0) {
    console.log('No duplicate pastas found!');
  } else {
    console.log(`Found ${duplicates.length} duplicates. Deleting them now...`);
    const result = await prisma.menuitems.deleteMany({
      where: {
        item_id: {
          in: duplicates
        }
      }
    });
    console.log(`Successfully deleted ${result.count} duplicate pizzas!`);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
