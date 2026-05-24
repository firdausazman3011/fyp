import { PrismaClient } from "@prisma/client";

/**
 * Vercel serverless: use Supabase pooler URL on port 6543 with `?pgbouncer=true`
 * and append `&connection_limit=1` to DATABASE_URL per function instance.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}
