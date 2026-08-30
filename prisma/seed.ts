import 'dotenv/config';
import bcrypt from 'bcryptjs';
import prisma from '../src/lib/db';

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = 'admin';

  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'admin' },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    
    await prisma.user.create({
      data: {
        name: 'Admin',
        email: adminEmail,
        passwordHash,
        role: 'admin',
        status: 'active',
        emailVerified: true,
      },
    });
    console.log(`Created default admin user with email: ${adminEmail}`);
  } else {
    console.log('Admin user already exists. Skipping creation.');
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
