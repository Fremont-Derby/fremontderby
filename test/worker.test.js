import test from "node:test";
import assert from "node:assert/strict";
import worker, { renderLandingPage } from "../src/index.js";

const env = {
  CF_VERSION_METADATA: {
    id: "test-version-123",
    tag: "test",
    timestamp: "2026-08-09T23:40:00Z",
  },
};

test("landing page identifies Fremont Derby and deployed version", () => {
  const html = renderLandingPage(env);
  assert.match(html, /Fremont Derby/);
  assert.match(html, /test-version-123/);
});

test("health endpoint reports service and Worker version", async () => {
  const response = await worker.fetch(new Request("https://fremontderby.com/health"), env);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), {
    ok: true,
    service: "fremontderby",
    version: "test-version-123",
    versionTag: "test",
    deployedAt: "2026-08-09T23:40:00Z",
  });
});
