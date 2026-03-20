import prisma from './lib/prisma.js';

async function getUsers() {
  try {
    const users = await prisma.user.findMany();
    console.log(JSON.stringify(users, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

getUsers();
