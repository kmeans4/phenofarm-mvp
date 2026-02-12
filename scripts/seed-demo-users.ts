import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedDemoUsers() {
  // Pre-computed bcrypt hash for 'password123'
  const passwordHash = '$2b$10$2XDH7dcUyKH00bPi7w6gtODcHHuXglFFkKoTglZsnGzneysc1Kcl6';

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

  console.log('Seeding demo users with bcrypt password hashes...\n');

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
      console.log(`✓ Updated existing user: ${user.email}`);
    } else {
      await prisma.user.create({
        data: {
          email: user.email,
          passwordHash,
          name: user.name,
          role: user.role,
        },
      });
      console.log(`✓ Created new user: ${user.email}`);
    }
  }

  console.log('\n✅ Demo users seeded successfully!');
  await prisma.$disconnect();
}

seedDemoUsers().catch((error) => {
  console.error('Error seeding demo users:', error);
  process.exit(1);
});
