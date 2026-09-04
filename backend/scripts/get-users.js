import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.users.findMany({
    select: {
      user_id: true,
      full_name: true,
      email: true,
      role: true,
      created_at: true
    }
  });
  
  if (users.length === 0) {
    console.log("No users found in the database. It is currently empty.");
  } else {
    console.log(`Found ${users.length} user(s):`);
    console.table(users);
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
