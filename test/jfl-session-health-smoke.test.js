import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { JFL_SIMULATED_GOOGLE_TOKEN } from '../src/supabaseAuth.js';
import { JFL_SESSION_URL, verifyJflSessionHealth } from '../scripts/smoke-jfl-session-health.mjs';

function response(status, body, contentType = 'application/json; charset=utf-8') {
  return new Response(body, { status, headers: { 'content-type': contentType } });
}

test('JFL health probe uses an explicit JFL-only simulated session and reads no private fields', async () => {
  let requested;
  const result = await verifyJflSessionHealth((url, options) => {
    requested = { url, options };
    return response(200, '{"teamManagement":{"captain_teams":[],"invitations":[]}}');
  });
  assert.equal(result, true);
  assert.equal(requested.url, JFL_SESSION_URL);
  assert.equal(requested.options.headers.authorization, `Bearer ${JFL_SIMULATED_GOOGLE_TOKEN}`);
  assert.equal(requested.options.headers.accept, 'application/json');
});

test('JFL session health rejects auth failure, HTML, malformed JSON and missing teams shape', async () => {
  for (const bad of [
    response(401, '{"error":"expired"}'),
    response(200, '<html>challenge</html>', 'text/html'),
    response(200, '{not-json'),
    response(200, '{"teamManagement":{"captain_teams":[]}}'),
  ]) {
    await assert.rejects(verifyJflSessionHealth(() => bad));
  }
});

test('permanent JFL deployment gates and evidence include session health before success', () => {
  const workflow = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
  const season = workflow.indexOf('name: Verify JFL public season bootstrap');
  const session = workflow.indexOf('name: Verify JFL simulated session and team bootstrap');
  const proof = workflow.indexOf('name: Record JFL deployment proof');
  assert.ok(season > 0 && session > season && proof > session);
  assert.match(workflow.slice(session, proof), /if: github\.ref == 'refs\/heads\/fremontderby-jfl'/);
  assert.match(workflow.slice(session, proof), /node scripts\/smoke-jfl-session-health\.mjs/);
  assert.match(workflow.slice(proof), /simulated signed-in session loaded team management JSON/);
});
