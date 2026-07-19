import { and, eq, sql } from "drizzle-orm";
import { getAppUser } from "../../app-auth";
import { getDb } from "../../../db";
import { ensureWorkspaceSchema } from "../../../db/ensure-schema";
import { auditEvents, memberships, organizations, users, workspaceStates } from "../../../db/schema";

const MAX_WORKSPACE_BYTES = 1_000_000;

function accountOrganization(email: string) {
  return {
    id: `account:${email}`,
    name: `${email} account`,
  };
}

async function requireMembership() {
  const identity = await getAppUser();
  if (!identity) return null;

  await ensureWorkspaceSchema();
  const db = getDb();
  const email = identity.email.trim().toLowerCase();
  const userId = `user:${email}`;
  const organization = accountOrganization(email);
  const membershipId = `${organization.id}:${userId}`;

  await db.insert(organizations).values(organization).onConflictDoNothing();
  await db.insert(users).values({ id: userId, email, displayName: identity.displayName }).onConflictDoUpdate({
    target: users.email,
    set: { displayName: identity.displayName, lastSeenAt: sql`CURRENT_TIMESTAMP` },
  });

  let [membership] = await db.select().from(memberships).where(eq(memberships.id, membershipId)).limit(1);
  if (!membership) {
    await db.insert(memberships).values({ id: membershipId, organizationId: organization.id, userId, role: "admin" });
    [membership] = await db.select().from(memberships).where(eq(memberships.id, membershipId)).limit(1);
  }

  await db.insert(workspaceStates).values({ organizationId: organization.id, updatedBy: userId }).onConflictDoNothing();
  return { identity, userId, membership, organization, db };
}

export async function GET() {
  try {
    const context = await requireMembership();
    if (!context) return Response.json({ error: "Authentication required" }, { status: 401 });
    const [workspace] = await context.db.select().from(workspaceStates).where(eq(workspaceStates.organizationId, context.organization.id)).limit(1);
    return Response.json({
      organization: context.organization,
      user: { email: context.identity.email, displayName: context.identity.displayName, role: context.membership.role },
      workspace: JSON.parse(workspace?.stateJson || "{}"),
      version: workspace?.version ?? 0,
      updatedAt: workspace?.updatedAt ?? null,
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Workspace unavailable" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const context = await requireMembership();
    if (!context) return Response.json({ error: "Authentication required" }, { status: 401 });
    if (context.membership.role === "viewer") return Response.json({ error: "Viewer access is read-only" }, { status: 403 });

    const payload = await request.json() as { workspace?: unknown; expectedVersion?: number; action?: string };
    if (!payload.workspace || typeof payload.workspace !== "object" || Array.isArray(payload.workspace)) {
      return Response.json({ error: "workspace must be an object" }, { status: 400 });
    }
    if (!Number.isInteger(payload.expectedVersion) || Number(payload.expectedVersion) < 0) {
      return Response.json({ error: "expectedVersion must be a non-negative integer" }, { status: 400 });
    }

    const stateJson = JSON.stringify(payload.workspace);
    if (new TextEncoder().encode(stateJson).byteLength > MAX_WORKSPACE_BYTES) {
      return Response.json({ error: "Workspace state exceeds the 1 MB limit" }, { status: 413 });
    }

    const [updated] = await context.db.update(workspaceStates).set({
      stateJson,
      version: sql`${workspaceStates.version} + 1`,
      updatedBy: context.userId,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    }).where(and(eq(workspaceStates.organizationId, context.organization.id), eq(workspaceStates.version, Number(payload.expectedVersion)))).returning();

    if (!updated) {
      const [current] = await context.db.select().from(workspaceStates).where(eq(workspaceStates.organizationId, context.organization.id)).limit(1);
      return Response.json({ error: "Account data changed in another session", workspace: JSON.parse(current?.stateJson || "{}"), version: current?.version ?? 0 }, { status: 409 });
    }

    await context.db.insert(auditEvents).values({
      id: crypto.randomUUID(),
      organizationId: context.organization.id,
      actorUserId: context.userId,
      action: String(payload.action || "updated account data").slice(0, 240),
    });

    return Response.json({ workspace: JSON.parse(updated.stateJson), version: updated.version, updatedAt: updated.updatedAt });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Workspace update failed" }, { status: 500 });
  }
}
