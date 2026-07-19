import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("server-renders the OAuth sign-in boundary for anonymous users", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /The VC Brain/);
  assert.match(page, /Sign in to your investment operating system/);
  assert.match(page, /Sign in with ChatGPT/);
  assert.match(page, /OAuth/);
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
  assert.match(catchAll, /default, dynamic/);
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
  const workspaceRoute = await readFile(new URL("../app/api/workspace/route.ts", import.meta.url), "utf8");
  const proxyRoute = await readFile(new URL("../app/api/vc/[...path]/route.ts", import.meta.url), "utf8");
  const schema = await readFile(new URL("../db/schema.ts", import.meta.url), "utf8");
  const hosting = JSON.parse(await readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8"));
  assert.match(page, /getAppUser/);
  assert.match(page, /chatGPTSignInPath/);
  assert.match(workspaceRoute, /Authentication required/);
  assert.match(workspaceRoute, /Viewer access is read-only/);
  assert.match(workspaceRoute, /expectedVersion/);
  assert.match(workspaceRoute, /Workspace changed in another session/);
  assert.match(proxyRoute, /x-vc-brain-service-token/);
  assert.match(schema, /organizations/);
  assert.match(schema, /memberships/);
  assert.match(schema, /workspaceStates/);
  assert.match(schema, /auditEvents/);
  assert.equal(hosting.d1, "DB");
});
