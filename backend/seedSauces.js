import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const sauces = [
  { name: 'Mayonaise', category: 'Sauces', description: 'Portie mayonaise', price: 1.00, image_url: '/images/sauces/Mayonaise.jpg' },
  { name: 'Ketchup', category: 'Sauces', description: 'Portie ketchup', price: 1.00, image_url: '/images/sauces/Ketchup.jpg' },
  { name: 'Curry', category: 'Sauces', description: '', price: 1.00, image_url: '/images/sauces/CURRY.jpg' },
  { name: 'Barbecue', category: 'Sauces', description: '', price: 1.00, image_url: '/images/sauces/BARBECUE.jpg' },
  { name: 'Zoetzuur', category: 'Sauces', description: '', price: 1.00, image_url: '/images/sauces/Zoetzuur.jpg' },
  { name: 'Looksaus', category: 'Sauces', description: '', price: 1.00, image_url: '/images/sauces/LOOKSAUS.jpg' },
  { name: 'Samourai', category: 'Sauces', description: '', price: 1.00, image_url: '/images/sauces/SAMOURAI.jpg' }
];

async function main() {
  console.log('Inserting sauces...');
  for (const sauce of sauces) {
    await prisma.menuitems.create({
      data: sauce
    });
  }
  console.log(`Successfully inserted ${sauces.length} sauces!`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
