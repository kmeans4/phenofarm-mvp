import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedDemoUsers() {
  const password = 'password123';
  const passwordHash = await bcrypt.hash(password, 10);

  const demoUsers = [
    {
      email: 'admin@phenofarm.com',
      role: 'ADMIN' as const,
      name: 'Admin User',
    },
    {
      email: 'grower@vtnurseries.com',
      role: 'GROWER' as const,
      name: 'Green Mountain Grower',
    },
    {
      email: 'dispensary@greenvermont.com',
      role: 'DISPENSARY' as const,
      name: 'Green Vermont Dispensary',
    },
  ];

  console.log('Seeding demo users with bcrypt password hashes...');

  for (const user of demoUsers) {
    const existingUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (existingUser) {
      await prisma.user.update({
        where: { email: user.email },
        data: {
          passwordHash,
          name: user.name,
          role: user.role,
        },
      });
      console.log(`Updated existing user: ${user.email}`);
    } else {
      await prisma.user.create({
        data: {
          email: user.email,
          passwordHash,
          name: user.name,
          role: user.role,
        },
      });
      console.log(`Created new user: ${user.email}`);
    }
  }

  console.log('Demo users seeded successfully!');
  await prisma.$disconnect();
}

seedDemoUsers().catch((error) => {
  console.error('Error seeding demo users:', error);
  process.exit(1);
});
