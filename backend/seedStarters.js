import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const starters = [
  { name: 'Lookbaguette', category: 'Starters', description: 'Lookbrood natuur', price: 3.00, image_url: '/images/starters/Lookbaguette.jpg' },
  { name: 'Lookbrood Kaas', category: 'Starters', description: '4 stuks', price: 3.60, image_url: '/images/starters/Lookbrood Kaas.jpg' },
  { name: 'Hot Wings', category: 'Starters', description: '6 stuks', price: 5.00, image_url: '/images/starters/Hot Wings.jpg' },
  { name: 'Chicken Tenders', category: 'Starters', description: '4 stuks', price: 7.00, image_url: '/images/starters/Chicken Tenders.jpg' },
  { name: 'Crispy Cheese Jalapeneos', category: 'Starters', description: '8 stuks', price: 5.00, image_url: '/images/starters/Crispy Cheese Jalapeneos.jpg' },
  { name: 'Lookbrood Natuur', category: 'Starters', description: '4 stuks', price: 3.00, image_url: '/images/starters/LOOKBROOD NATUUR.jpg' },
  { name: 'Lookbrood Kaas Ham', category: 'Starters', description: '4 stuks', price: 4.00, image_url: '/images/starters/LOOKBROOD KAAS HAM.jpg' },
  { name: 'Lookbrood Kaas Kip', category: 'Starters', description: '4 stuks', price: 4.00, image_url: '/images/starters/LOOKBROOD KAAS KIP.jpg' },
  { name: 'Lookbrood Salami', category: 'Starters', description: '4 stuks', price: 4.00, image_url: '/images/starters/LOOKBROOD SALAMI.jpg' },
  { name: 'Chicken Taquito\'s', category: 'Starters', description: '3 stuks', price: 6.50, image_url: '/images/starters/CHICKEN TAQUITO\'S.jpg' },
  { name: 'Chicken Wings', category: 'Starters', description: '8 stuks', price: 5.00, image_url: '/images/starters/CHICKEN WINGS.jpg' },
  { name: 'Chicken Nuggets', category: 'Starters', description: '8 stuks', price: 5.00, image_url: '/images/starters/CHICKEN NUGGETS.jpg' },
  { name: 'Chicken Fingers', category: 'Starters', description: '6 stuks', price: 5.00, image_url: '/images/starters/CHICKEN FINGERS.jpg' },
  { name: 'American Potatoes', category: 'Starters', description: '', price: 4.00, image_url: '/images/starters/AMERICAN POTATOES.jpg' }
];

async function main() {
  console.log('Inserting starters...');
  for (const starter of starters) {
    await prisma.menuitems.create({
      data: starter
    });
  }
  console.log(`Successfully inserted ${starters.length} starters!`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
