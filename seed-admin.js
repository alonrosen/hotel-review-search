const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
const bcrypt = require('bcryptjs');

const connectionString = process.env.DATABASE_URL || "postgres://3ce3341b966137cab14f69d8d117ae0c98037d896150992c012ff2f6cd6da040:sk_ZVzikXttdAfXcZ4n810aK@db.prisma.io:5432/postgres?sslmode=require";
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = 'admin@example.com';
  const password = 'admin';
  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: { role: 'admin' },
    create: {
      email,
      name: 'Admin',
      passwordHash,
      role: 'admin',
      status: 'active',
      emailVerified: true,
    }
  });

  console.log('Admin user seeded:', admin);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
