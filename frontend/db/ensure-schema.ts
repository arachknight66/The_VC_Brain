import { sql } from "drizzle-orm";
import { getDb } from ".";

let schemaPromise: Promise<void> | null = null;

async function createWorkspaceSchema() {
  const db = getDb();

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS vc_organizations (
      id text PRIMARY KEY,
      name text NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS vc_users (
      id text PRIMARY KEY,
      email text NOT NULL UNIQUE,
      display_name text NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      last_seen_at timestamp with time zone DEFAULT now() NOT NULL
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS vc_memberships (
      id text PRIMARY KEY,
      organization_id text NOT NULL REFERENCES vc_organizations(id),
      user_id text NOT NULL REFERENCES vc_users(id),
      role text DEFAULT 'member' NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS vc_workspace_states (
      organization_id text PRIMARY KEY REFERENCES vc_organizations(id),
      state_json text DEFAULT '{}' NOT NULL,
      version integer DEFAULT 0 NOT NULL,
      updated_by text NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS vc_audit_events (
      id text PRIMARY KEY,
      organization_id text NOT NULL REFERENCES vc_organizations(id),
      actor_user_id text NOT NULL REFERENCES vc_users(id),
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
