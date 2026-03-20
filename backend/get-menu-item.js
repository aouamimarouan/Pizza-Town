import prisma from './lib/prisma.js';

async function getMenuItem() {
  try {
    const item = await prisma.menuitems.findFirst({ where: { is_available: true } });
    console.log(JSON.stringify(item, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

getMenuItem();
