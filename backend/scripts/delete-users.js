import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Cascading truncation of users to clear orders, reservations, and audit logs associated with them
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE users CASCADE;`);
  console.log('All users (and their related data) deleted successfully.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
