import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { admins } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in .env before seeding.");
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await db.select().from(admins).where(eq(admins.email, email));

  if (existing.length > 0) {
    await db.update(admins).set({ passwordHash }).where(eq(admins.email, email));
  } else {
    await db.insert(admins).values({ email, passwordHash });
  }

  console.log(`Admin account ready: ${email}`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
