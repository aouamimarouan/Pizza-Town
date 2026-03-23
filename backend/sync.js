import { PrismaClient } from '@prisma/client';

const localPrisma = new PrismaClient({
  datasources: { db: { url: 'postgresql://postgres:26072022@localhost:1937/pizzatown' } }
});

const remotePrisma = new PrismaClient({
  datasources: { db: { url: 'postgresql://ukuphisdkslgdnr9hvb3:NMKGNfvnSlY7VnVUaytwxT58DVd5VU@bg72vzbbqgqpdugklegi-postgresql.services.clever-cloud.com:50013/bg72vzbbqgqpdugklegi' } }
});

async function sync() {
  console.log('Connecting to databases...');
  
  // 1. Sync Users
  const users = await localPrisma.users.findMany();
  console.log(`Found ${users.length} users locally. Migrating...`);
  for (const user of users) {
    await remotePrisma.users.upsert({
      where: { email: user.email },
      update: {},
      create: user
    });
  }

  // 2. Sync Menu Items
  const menuitems = await localPrisma.menuitems.findMany();
  console.log(`Found ${menuitems.length} menu items locally. Migrating...`);
  for (const item of menuitems) {
    await remotePrisma.menuitems.upsert({
      where: { item_id: item.item_id },
      update: {},
      create: item
    });
  }

  // 3. Sync Extra Items
  const extraitems = await localPrisma.extraItem.findMany();
  console.log(`Found ${extraitems.length} extra items locally. Migrating...`);
  for (const item of extraitems) {
    await remotePrisma.extraItem.upsert({
      where: { id: item.id },
      update: {},
      create: item
    });
  }

  console.log('✅ Done syncing data to production!');
  process.exit(0);
}

sync().catch(e => {
  console.error(e);
  process.exit(1);
});
