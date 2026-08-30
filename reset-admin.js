const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
const bcrypt = require('bcryptjs');

const connectionString = process.env.DATABASE_URL || "postgres://3ce3341b966137cab14f69d8d117ae0c98037d896150992c012ff2f6cd6da040:sk_ZVzikXttdAfXcZ4n810aK@db.prisma.io:5432/postgres?sslmode=require";
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminUser = await prisma.user.findFirst({
    where: { role: 'admin' }
  });

  if (!adminUser) {
    console.log("No admin user found!");
    return;
  }

  const passwordHash = await bcrypt.hash('admin', 10);

  const updatedAdmin = await prisma.user.update({
    where: { id: adminUser.id },
    data: { passwordHash }
  });

  console.log(`Admin email is: ${updatedAdmin.email}`);
  console.log("Password has been reset to: admin");
}

main().catch(console.error).finally(() => prisma.$disconnect());
