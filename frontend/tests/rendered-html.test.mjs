import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders The VC Brain dashboard", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /The VC Brain/);
  assert.match(html, /Intelligence Platform/);
  assert.match(html, /Signal Scanner/);
  assert.match(html, /Pitch Intake/);
});

test("ships live scanner and pitch-upload API integrations", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /\/scanners\/run/);
  assert.match(page, /\/founders\/inbound\/upload/);
  assert.match(page, /\/dashboard\/summary/);
  assert.match(page, /Founder Axis/);
  assert.match(page, /Idea-vs-Market Axis/);
  assert.match(page, /Trust Claim Confidence/);
  assert.match(page, /GitHub/);
  assert.match(page, /Substack/);
  assert.match(page, /Devpost/);
  assert.match(page, /LinkedIn/);
  assert.match(page, /NEXT_PUBLIC_VC_BRAIN_API_URL/);
});
