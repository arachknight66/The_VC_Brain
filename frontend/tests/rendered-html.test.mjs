import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${path}-${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the investment operating system", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /The VC Brain/);
  assert.match(html, /Investment OS/);
  assert.match(html, /Inbox/);
  assert.match(html, /Pipeline/);
  assert.match(html, /Diligence/);
  assert.match(html, /Portfolio/);
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
  assert.match(page, /NEXT_PUBLIC_VC_BRAIN_API_URL/);
});

test("serves deep-linkable workflow routes", async () => {
  for (const path of ["/inbox", "/pipeline", "/companies/example", "/diligence/example", "/compare?ids=a,b", "/memos/example", "/ic", "/portfolio", "/research", "/lab", "/intake"]) {
    const response = await render(path);
    assert.equal(response.status, 200, `${path} should resolve`);
  }
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
  assert.match(page, /immutable decision record/);
  assert.match(page, /getPortfolioAlerts/);
  assert.match(page, /Material change queue/);
  assert.match(page, /Decision memory/);
  assert.match(page, /normalizeWorkspace/);
  assert.doesNotMatch(page, /chatbot/i);
});
