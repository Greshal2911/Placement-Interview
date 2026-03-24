import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import type { PoolConfig } from "@neondatabase/serverless";

declare global {
  var prisma: PrismaClient | undefined;
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL must be set for Prisma");
}

const createPrismaClient = () => {
  const poolConfig: PoolConfig = { connectionString: databaseUrl };

  return new PrismaClient({
    log: ["error", "warn"],
    adapter: new PrismaNeon(poolConfig),
  });
};

export const prisma = global.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

export default prisma;
