import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyDemoUsers() {
  const demoEmails = [
    'admin@phenofarm.com',
    'grower@vtnurseries.com',
    'dispensary@greenvermont.com',
  ];

  console.log('Verifying demo users...\n');

  for (const email of demoEmails) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      const hasPasswordHash = !!user.passwordHash;
      const passwordHashLength = user.passwordHash ? user.passwordHash.length : 0;
      console.log(`✓ ${email}`);
      console.log(`  - User exists: Yes`);
      console.log(`  - Role: ${user.role}`);
      console.log(`  - Has passwordHash: ${hasPasswordHash}`);
      console.log(`  - passwordHash length: ${passwordHashLength} characters`);
      if (user.passwordHash) {
        console.log(`  - passwordHash starts with: ${user.passwordHash.substring(0, 20)}...`);
      }
    } else {
      console.log(`✗ ${email}`);
      console.log(`  - User exists: No`);
    }
    console.log('');
  }

  await prisma.$disconnect();
}

verifyDemoUsers().catch((error) => {
  console.error('Error verifying demo users:', error);
  process.exit(1);
});
