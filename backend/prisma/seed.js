import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminExists = await prisma.user.findUnique({
    where: { username: 'admin' },
  });

  if (!adminExists) {
    const passwordHash = await bcrypt.hash('admin', 10);
    await prisma.user.create({
      data: {
        username: 'admin',
        passwordHash,
        role: 'admin',
      },
    });
    console.log('Seed: Default admin user created successfully.');
  } else {
    console.log('Seed: Admin user already exists. Skipping...');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
