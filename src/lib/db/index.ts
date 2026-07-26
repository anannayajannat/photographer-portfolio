import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const globalForDb = global as unknown as { pgPool?: Pool };

// Same reasoning as the old Prisma singleton: Next.js dev hot-reloads
// modules, which would otherwise open a new connection pool on every save.
const pool =
  globalForDb.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: process.env.NODE_ENV === "production" ? 5 : 3, // serverless: keep pools small, functions scale horizontally
  });

if (process.env.NODE_ENV !== "production") globalForDb.pgPool = pool;

export const db = drizzle(pool, { schema });
export * as schema from "./schema";
