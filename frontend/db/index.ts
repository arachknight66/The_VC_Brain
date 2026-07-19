import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let client: ReturnType<typeof postgres> | null = null;

export function getDb() {
  const connectionString =
    process.env.DATABASE_URL?.trim() || process.env.POSTGRES_URL?.trim();
  if (!connectionString) {
    throw new Error(
      "Postgres is unavailable. Set DATABASE_URL or connect a Neon database in Vercel."
    );
  }

  client ??= postgres(connectionString, {
    max: 1,
    prepare: false,
    idle_timeout: 20,
  });
  return drizzle(client, { schema });
}
