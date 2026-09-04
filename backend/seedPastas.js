import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const pastas = [
  { name: 'Pasta Scampi', category: 'Pastas', description: '', price: 12.00, image_url: '/images/pastas/Pasta Scampi.jpg' },
  { name: 'Pasta Salmone', category: 'Pastas', description: '', price: 12.00, image_url: '/images/pastas/Pasta Salmone.jpg' },
  { name: 'Pasta Seafood', category: 'Pastas', description: '', price: 12.00, image_url: '/images/pastas/PASTA SEAFOOD.jpg' },
  { name: 'Pasta Cheesy Chicken', category: 'Pastas', description: '', price: 12.00, image_url: '/images/pastas/PASTA CHEESY CHICKEN.jpg' },
  { name: 'Pasta Curry Chicken', category: 'Pastas', description: '', price: 12.00, image_url: '/images/pastas/PASTA CURRY CHICKEN.jpg' },
  { name: 'Pasta Pesto Chicken', category: 'Pastas', description: '', price: 12.00, image_url: '/images/pastas/PASTA PESTO CHICKEN.jpg' },
  { name: 'Pasta Arabiata', category: 'Pastas', description: '', price: 12.00, image_url: '/images/pastas/PASTA ARABIATA.jpg' },
  { name: 'Pasta Carbonara', category: 'Pastas', description: '', price: 12.00, image_url: '/images/pastas/PASTA CARBONARA.jpg' },
  { name: 'Pasta Bolognese', category: 'Pastas', description: '', price: 12.00, image_url: '/images/pastas/Pasta Bolognese.jpg' },
  { name: 'Pasta Vier Kazen', category: 'Pastas', description: '', price: 12.00, image_url: '/images/pastas/PASTA VIER KAZEN.jpg' },
  { name: 'Pasta Chicken', category: 'Pastas', description: '', price: 12.00, image_url: '/images/pastas/PASTA CHICKEN.jpg' },
  { name: 'Lasagne Bolognese', category: 'Pastas', description: '', price: 12.00, image_url: '/images/pastas/Lasagne Bolognese.jpg' }
];

async function main() {
  console.log('Inserting pastas...');
  for (const pasta of pastas) {
    await prisma.menuitems.create({
      data: pasta
    });
  }
  console.log(`Successfully inserted ${pastas.length} pastas!`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
