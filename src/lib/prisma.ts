import { PrismaClient } from "@prisma/client";

function ensureDatabaseUrl() {
  const prod = process.env.DATABASE_URL?.trim();
  if (prod) return;
  const dev = process.env.DEV_DATABASE_URL?.trim();
  if (!dev) return;
  process.env.DATABASE_URL = dev;
  console.warn(
    "[prisma] DATABASE_URL was missing or empty; using DEV_DATABASE_URL",
  );
}

ensureDatabaseUrl();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
