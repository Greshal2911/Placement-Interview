import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";
import type { HTTPQueryOptions } from "@neondatabase/serverless";

declare global {
  var prisma: PrismaClient | undefined;
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL must be set for Prisma");
}

const createPrismaClient = () => {
  const httpOptions: HTTPQueryOptions<false, false> = {};

  return new PrismaClient({
    log: ["error", "warn"],
    adapter: new PrismaNeonHttp(databaseUrl, httpOptions),
  });
};

export const prisma = global.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

export default prisma;
