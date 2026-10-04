import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { JFL_SEASONS_URL, verifyJflSeasonBootstrap } from '../scripts/smoke-jfl-season-bootstrap.mjs';

function response(status, body, contentType = 'application/json; charset=utf-8') {
  return new Response(body, { status, headers: { 'content-type': contentType } });
}

test('JFL deployment smoke requires a public 200 JSON season list', async () => {
  let requested;
  const count = await verifyJflSeasonBootstrap((url, options) => {
    requested = { url, options };
    return response(200, '{"seasons":[{"id":"season-1"}]}');
  });
  assert.equal(count, 1);
  assert.equal(requested.url, JFL_SEASONS_URL);
  assert.equal(requested.options.headers.accept, 'application/json');
  assert.equal(requested.options.headers.authorization, undefined);
});

test('JFL deployment smoke rejects 405, HTML, malformed JSON, and wrong shape', async () => {
  for (const result of [
    response(405, '{"error":"read model failed"}'),
    response(200, '<html>edge error</html>', 'text/html'),
    response(200, '{not-json'),
    response(200, '{"status":"ok"}'),
  ]) {
    await assert.rejects(verifyJflSeasonBootstrap(() => result));
  }
});

test('JFL permanent-branch deploy checks season bootstrap after exact-commit smoke', () => {
  const workflow = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
  const exactCommit = workflow.indexOf('name: Verify deployed lane and exact commit');
  const gate = workflow.indexOf('name: Verify JFL public season bootstrap');
  assert.ok(exactCommit > 0 && gate > exactCommit);
  const nextGate = workflow.indexOf('name: Verify JFL simulated session and team bootstrap', gate);
  assert.ok(nextGate > gate);
  assert.match(workflow.slice(gate, nextGate), /if: github\.ref == 'refs\/heads\/fremontderby-jfl'/);
  assert.match(workflow.slice(gate, nextGate), /node scripts\/smoke-jfl-season-bootstrap\.mjs/);
});
