import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const pizzas = [
  { name: 'Margherita', category: 'Pizzas', description: 'tomatensaus, kaas', price: 11.95, image_url: '/images/pizzas/Margherita.jpg' },
  { name: 'Proscuitto', category: 'Pizzas', description: 'kaas, ham, mozzarella', price: 11.95, image_url: '/images/pizzas/Prosciutto.jpg' },
  { name: 'Funghi', category: 'Pizzas', description: 'kaas, champignons', price: 11.95, image_url: '/images/pizzas/i106951-pizza-ai-funghi-forestiere.jpg' },
  { name: 'Proscuitto Funghi', category: 'Pizzas', description: 'kaas, champignons, ham, mozzarella', price: 11.95, image_url: '/images/pizzas/Proscuitto Funghi.jpg' },
  { name: 'Pepperoni', category: 'Pizzas', description: 'dubbele portie pepperoni, kaas', price: 11.95, image_url: '/images/pizzas/peperoni.jpg' },
  { name: 'Veggie', category: 'Pizzas', description: 'champignons, paprika, ui, olijven, mais, tomaat', price: 11.95, image_url: '/images/pizzas/Veggie.jpg' },
  { name: 'Cheesy Mix', category: 'Pizzas', description: 'roomsaus, feta, gorgonzola, mozzarella, kaas', price: 11.95, image_url: '/images/pizzas/Cheesy Mix.jpg' },
  { name: 'The goat cheese', category: 'Pizzas', description: 'roomsaus, kaas, geitenkaas, honing, mozzarella', price: 11.95, image_url: '/images/pizzas/The goat cheese.jpg' },
  { name: 'Mexican Chilli', category: 'Pizzas', description: 'pepperoni, ui, olijven, look, kappertjes', price: 11.95, image_url: '/images/pizzas/Mexican Chilli.jpg' },
  { name: 'Napolitano', category: 'Pizzas', description: 'ansjovis, kappertjes, olijven', price: 11.95, image_url: '/images/pizzas/Napolitano.jpg' },
  { name: 'Seafood de luxe', category: 'Pizzas', description: 'garnalen, mosselen, ui, tonijn', price: 11.95, image_url: '/images/pizzas/Seafood de luxe.jpg' },
  { name: 'Scampini', category: 'Pizzas', description: 'scampi, tomaten, ui, look', price: 11.95, image_url: '/images/pizzas/Scampini.jpg' },
  { name: 'Scampi Diabolo', category: 'Pizzas', description: 'pikantesaus, scampi\'s, ui', price: 11.95 },
  { name: 'Tuna', category: 'Pizzas', description: 'tonijn, ui, paprika, look', price: 11.95, image_url: '/images/pizzas/Tuna.jpg' },
  { name: 'Scampi de luxe', category: 'Pizzas', description: 'roomsaus, scampi, olijven, mais, oregano, ui', price: 11.95, image_url: '/images/pizzas/scampi de luxe.jpg' },
  { name: 'Salmon', category: 'Pizzas', description: 'roomsaus, zalm, ui', price: 11.95, image_url: '/images/pizzas/salmon.jpg' },
  { name: 'BBQ Chicken', category: 'Pizzas', description: 'bbq saus, kip, paprika, ui, mozzarella', price: 11.95, image_url: '/images/pizzas/bbq chicken.jpg' },
  { name: 'BBQ Beef', category: 'Pizzas', description: 'bbq saus, rundsvlees, paprika, jalapeneos', price: 11.95, image_url: '/images/pizzas/bbq beef.jpg' },
  { name: 'BBQ Meatballs', category: 'Pizzas', description: 'bbq saus, gehaktballetjes, paprika, ui, mozzarella', price: 11.95, image_url: '/images/pizzas/bbq meatballs.jpg' },
  { name: 'BBQ Kebab', category: 'Pizzas', description: 'bbq saus, kebab, paprika, ui, mozzarella', price: 11.95, image_url: '/images/pizzas/bbq kebab.jpg' },
  { name: 'Indian Curry', category: 'Pizzas', description: 'curry saus, kip, ananas, ui', price: 11.95, image_url: '/images/pizzas/indian curry.jpg' },
  { name: 'Creamy Chicken', category: 'Pizzas', description: 'roomsaus, kip, champignons, ui', price: 11.95, image_url: '/images/pizzas/creamy chicken.jpg' },
  { name: 'Creamy Spekkie', category: 'Pizzas', description: 'spek, champignons, ui', price: 11.95, image_url: '/images/pizzas/creamy spekkie.jpg' },
  { name: 'Creamy Kebab', category: 'Pizzas', description: 'roomsaus, kebab, champignons, ui', price: 11.95, image_url: '/images/pizzas/creamy kebab.jpg' },
  { name: 'honey Chicken', category: 'Pizzas', description: 'roomsaus, kip, ui, honing', price: 11.95, image_url: '/images/pizzas/honey chicken.jpg' },
  { name: 'Spicy de luxe', category: 'Pizzas', description: 'kip, paprika, jalapeneos, ui, mais', price: 11.95, image_url: '/images/pizzas/Spicy de luxe.jpg' },
  { name: 'Hawai', category: 'Pizzas', description: 'ham, kip, ananas, mozzarella', price: 11.95, image_url: '/images/pizzas/Hawai.jpg' },
  { name: 'Calzone Oriental', category: 'Pizzas', description: 'gevouwen pizza, currysaus, kip, ananas, paprika, ui', price: 11.95, image_url: '/images/pizzas/Calzone Oriental.jpg' },
  { name: 'Calzone', category: 'Pizzas', description: 'gevouwen pizza, bolognesesaus, champignons, paprika, salami, ham', price: 11.95, image_url: '/images/pizzas/calzone.jpg' },
  { name: 'Mafioso', category: 'Pizzas', description: 'pepperoni, rundsvlees, olijven, ui, mozzarella', price: 11.95, image_url: '/images/pizzas/Mafioso.jpg' },
  { name: 'Bolognese', category: 'Pizzas', description: 'Bolognese saus, look, ui, extra saus', price: 11.95, image_url: '/images/pizzas/Bolognese.jpg' },
  { name: 'Merguez', category: 'Pizzas', description: 'dubbele portie merguez, champignons', price: 11.95, image_url: '/images/pizzas/Merguez.jpg' },
  { name: 'Kefta', category: 'Pizzas', description: 'kefta, kaas, mozzarella', price: 11.95, image_url: '/images/pizzas/Kefta.jpg' },
  { name: 'Kebab', category: 'Pizzas', description: 'tomatensaus, paprika, ui, kebab', price: 11.95, image_url: '/images/pizzas/Kebab.jpg' },
  { name: 'Four seasons', category: 'Pizzas', description: 'ham, salami, paprika, champignons', price: 11.95, image_url: '/images/pizzas/Four seasons.jpg' },
  { name: 'Meat lovers', category: 'Pizzas', description: 'rundsvlees, ham, champignons, ui', price: 11.95, image_url: '/images/pizzas/Meat lovers.jpg' },
  { name: 'Supreme', category: 'Pizzas', description: 'rundsvlees, ham, champignons, ui, olijven, jalapeneos', price: 11.95, image_url: '/images/pizzas/Supreme.jpg' },
  { name: 'Cheesy chicken', category: 'Pizzas', description: 'kip, feta, mozzarella', price: 11.95, image_url: '/images/pizzas/chessy chicken.jpg' },
  { name: 'Burger', category: 'Pizzas', description: 'tomatensaus, kerstomaat, ui, cheddar, gehakt, augurk, bicky saus, gedroogd ui', price: 11.95, image_url: '/images/pizzas/Burger.jpg' },
  { name: 'Rucola', category: 'Pizzas', description: 'tomatensaus, kerstomaat, verse rucola blaadjes, ham, mozzarella', price: 11.95, image_url: '/images/pizzas/Rucola.jpg' },
  { name: 'Hot Lovers', category: 'Pizzas', description: 'ham, pepperoni, paprika, jalapeneos, rundsvlees', price: 11.95, image_url: '/images/pizzas/Hot Lovers.jpg' }
];

async function main() {
  console.log('Inserting pizzas...');
  for (const pizza of pizzas) {
    await prisma.menuitems.create({
      data: pizza
    });
  }
  console.log('Successfully inserted 41 pizzas!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
