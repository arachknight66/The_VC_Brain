import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("server-renders the Google OAuth sign-in boundary for anonymous users", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /The VC Brain/);
  assert.match(page, /Sign in to your investment operating system/);
  assert.match(page, /Continue with Google/);
  assert.match(page, /api\/auth\/google\/start/);
  assert.match(page, /dynamic = "force-dynamic"/);
});

test("ships reviewed signal and pitch-upload API integrations", async () => {
  const page = await readFile(new URL("../app/vc-workspace.tsx", import.meta.url), "utf8");
  assert.match(page, /\/scanners\/run/);
  assert.match(page, /persist: false/);
  assert.match(page, /\/signals\/review/);
  assert.match(page, /\/founders\/inbound\/upload/);
  assert.match(page, /\/dashboard\/summary/);
  assert.match(page, /Evidence ledger/);
  assert.match(page, /Compare/);
  assert.match(page, /Approve memo/);
  assert.match(page, /const API_BASE = "\/api\/vc"/);
});

test("serves deep-linkable workflow routes", async () => {
  const workspace = await readFile(new URL("../app/vc-workspace.tsx", import.meta.url), "utf8");
  const catchAll = await readFile(new URL("../app/[...route]/page.tsx", import.meta.url), "utf8");
  for (const path of ["/inbox", "/pipeline", "/companies/example", "/diligence/example", "/compare?ids=a,b", "/memos/example", "/ic", "/portfolio", "/research", "/lab", "/intake"]) {
    const segment = path.split(/[/?]/).filter(Boolean)[0];
    assert.match(workspace, new RegExp(segment === "companies" ? "companies" : segment), `${path} should resolve`);
  }
  assert.match(catchAll, /dynamic = "force-dynamic"/);
  assert.match(catchAll, /export default Page/);
});

test("gates decision-ready language on evidence completeness", async () => {
  const page = await readFile(new URL("../app/vc-workspace.tsx", import.meta.url), "utf8");
  assert.match(page, /function getDecision/);
  assert.match(page, /source_evidence/);
  assert.match(page, /trust_claims/);
  assert.match(page, /Claim extraction incomplete/);
  assert.match(page, /Evidence incomplete/);
  assert.match(page, /AI-generated content remains a working draft/);
  assert.doesNotMatch(page, /Ask anything/);
});

test("includes priority-two feedback and accessibility states", async () => {
  const page = await readFile(new URL("../app/vc-workspace.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(page, /function ToastRegion/);
  assert.match(page, /function LoadingWorkspace/);
  assert.match(page, /function ErrorBanner/);
  assert.match(page, /aria-live="polite"/);
  assert.match(page, /Select all visible companies/);
  assert.match(page, /ArrowDown/);
  assert.match(page, /navigator\.onLine/);
  assert.doesNotMatch(page, /vc-save-pipeline-view/);
  assert.match(styles, /prefers-reduced-motion/);
  assert.match(styles, /@media print/);
  assert.match(styles, /\.toast-region/);
});

test("includes priority-three decision intelligence", async () => {
  const page = await readFile(new URL("../app/vc-workspace.tsx", import.meta.url), "utf8");
  assert.match(page, /function DecisionLab/);
  assert.match(page, /getScenarioScore/);
  assert.match(page, /Stress-test conviction/);
  assert.match(page, /recordICDecision/);
  assert.match(page, /organization-shared decision record/);
  assert.match(page, /getPortfolioAlerts/);
  assert.match(page, /Material change queue/);
  assert.match(page, /Decision memory/);
  assert.match(page, /normalizeWorkspace/);
  assert.doesNotMatch(page, /chatbot/i);
});

test("enforces authenticated multi-user workspace persistence", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const appAuth = await readFile(new URL("../app/app-auth.ts", import.meta.url), "utf8");
  const googleAuth = await readFile(new URL("../app/google-auth.ts", import.meta.url), "utf8");
  const authStart = await readFile(new URL("../app/api/auth/google/start/route.ts", import.meta.url), "utf8");
  const authCallback = await readFile(new URL("../app/api/auth/google/callback/route.ts", import.meta.url), "utf8");
  const workspaceRoute = await readFile(new URL("../app/api/workspace/route.ts", import.meta.url), "utf8");
  const proxyRoute = await readFile(new URL("../app/api/vc/[...path]/route.ts", import.meta.url), "utf8");
  const database = await readFile(new URL("../db/index.ts", import.meta.url), "utf8");
  const schema = await readFile(new URL("../db/schema.ts", import.meta.url), "utf8");
  assert.match(page, /getAppUser/);
  assert.match(appAuth, /getGoogleUser/);
  assert.match(googleAuth, /createRemoteJWKSet/);
  assert.match(googleAuth, /GOOGLE_ALLOWED_EMAILS/);
  assert.match(googleAuth, /GOOGLE_WORKSPACE_DOMAIN/);
  assert.match(googleAuth, /GOOGLE_ALLOW_ANY_ACCOUNT/);
  assert.match(googleAuth, /split\(\/\[\\s,;\]\+\//);
  assert.match(googleAuth, /email_verified/);
  assert.match(authStart, /code_challenge_method/);
  assert.match(authStart, /S256/);
  assert.match(authStart, /GOOGLE_SESSION_COOKIE/);
  assert.match(authStart, /select_account/);
  assert.match(authCallback, /Invalid Google login state/);
  assert.match(authCallback, /error_description/);
  assert.match(authCallback, /verifyGoogleIdToken/);
  assert.match(page, /Continue with Google/);
  assert.match(await readFile(new URL("../app/vc-workspace.tsx", import.meta.url), "utf8"), /Switch Google account/);
  assert.match(workspaceRoute, /Authentication required/);
  assert.match(workspaceRoute, /Viewer access is read-only/);
  assert.match(workspaceRoute, /expectedVersion/);
  assert.match(workspaceRoute, /Workspace changed in another session/);
  assert.match(proxyRoute, /x-vc-brain-service-token/);
  assert.match(schema, /organizations/);
  assert.match(schema, /memberships/);
  assert.match(schema, /workspaceStates/);
  assert.match(schema, /auditEvents/);
  assert.match(database, /drizzle-orm\/postgres-js/);
  assert.match(database, /DATABASE_URL/);
});

test("ships the multi-reasoning investor chat box", async () => {
  const page = await readFile(new URL("../app/vc-workspace.tsx", import.meta.url), "utf8");
  assert.match(page, /function InvestorChat/);
  assert.match(page, /\/investor-briefing/);
  assert.match(page, /\/founders\/\$\{founder\.founder_id\}\/chat/);
  assert.match(page, /chat-fab/);
  assert.match(page, /Reading the evidence|Weighing the upside|Weighing the risks/);
  assert.match(page, /not an investment recommendation/i);
  assert.match(page, /<InvestorChat/);

  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.chat-fab/);
  assert.match(css, /\.chat-panel/);
  assert.match(css, /\.typing-dots/);
});
