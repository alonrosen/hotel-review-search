/* ──────────────────────────────────────────────────────────────
   Prisma client singleton for Next.js (Prisma 7 + PrismaPg)
   ────────────────────────────────────────────────────────────── */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL;

function makeClient() {
  if (!connectionString) {
    console.warn("DATABASE_URL or POSTGRES_PRISMA_URL is not set. Prisma may fail to connect.");
  }
  const pool = new pg.Pool(connectionString ? { connectionString } : {});
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? makeClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
