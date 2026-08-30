const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = 'alon.rose88+test@gmail.com';
  
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    console.log(`User ${email} not found.`);
    return;
  }

  const updated = await prisma.user.update({
    where: { email },
    data: {
      emailVerified: true,
      status: 'active'
    }
  });

  console.log(`Successfully updated ${email}:`, updated);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
