import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: Pool | undefined;
  pgAdapter: PrismaPg | undefined;
};

const datasourceUrl = process.env.DATABASE_URL;
if (!datasourceUrl) {
  throw new Error("DATABASE_URL is required to initialize PrismaClient");
}

const pgPool = globalForPrisma.pgPool ?? new Pool({ connectionString: datasourceUrl });
const pgAdapter = globalForPrisma.pgAdapter ?? new PrismaPg(pgPool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: pgAdapter,
    log: ["error"], // optional: more logs during debugging
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pgPool = pgPool;
  globalForPrisma.pgAdapter = pgAdapter;
}
