import prisma from './src/lib/db';

async function run() {
  console.log("Checking logs...");
  const logs = await prisma.log.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
  console.log("Logs:", logs);
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
