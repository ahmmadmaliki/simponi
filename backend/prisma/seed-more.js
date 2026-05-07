import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding extra users...');

  const usersToSeed = [
    { username: 'kadin', role: 'kadin' },
    { username: 'sekretaris', role: 'sekretaris' },
    { username: 'budi', role: 'staff' },
  ];

  for (const user of usersToSeed) {
    const existing = await prisma.user.findUnique({ where: { username: user.username } });
    if (!existing) {
      const passwordHash = await bcrypt.hash(user.username, 10);
      await prisma.user.create({
        data: {
          username: user.username,
          passwordHash,
          role: user.role
        }
      });
      console.log(`User ${user.username} created with password '${user.username}'`);
    } else {
      console.log(`User ${user.username} already exists`);
    }
  }

  console.log('Finished seeding users.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
