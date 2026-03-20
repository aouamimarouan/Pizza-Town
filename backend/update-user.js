import prisma from './lib/prisma.js';
import bcrypt from 'bcryptjs';

async function updateUser() {
  try {
    const password_hash = await bcrypt.hash('password123', 12);
    await prisma.users.update({
      where: { email: 'test1@gmail.com' },
      data: { password_hash }
    });
    console.log('User password updated successfully.');
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

updateUser();
