import { sql } from "drizzle-orm";
import { getDb } from ".";

let schemaPromise: Promise<void> | null = null;

async function createWorkspaceSchema() {
  const db = getDb();

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS organizations (
      id text PRIMARY KEY,
      name text NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id text PRIMARY KEY,
      email text NOT NULL UNIQUE,
      display_name text NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      last_seen_at timestamp with time zone DEFAULT now() NOT NULL
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS memberships (
      id text PRIMARY KEY,
      organization_id text NOT NULL REFERENCES organizations(id),
      user_id text NOT NULL REFERENCES users(id),
      role text DEFAULT 'member' NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS workspace_states (
      organization_id text PRIMARY KEY REFERENCES organizations(id),
      state_json text DEFAULT '{}' NOT NULL,
      version integer DEFAULT 0 NOT NULL,
      updated_by text NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS audit_events (
      id text PRIMARY KEY,
      organization_id text NOT NULL REFERENCES organizations(id),
      actor_user_id text NOT NULL REFERENCES users(id),
      action text NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL
    )
  `);
}

export async function ensureWorkspaceSchema() {
  schemaPromise ??= createWorkspaceSchema().catch((error) => {
    schemaPromise = null;
    throw error;
  });
  await schemaPromise;
}
