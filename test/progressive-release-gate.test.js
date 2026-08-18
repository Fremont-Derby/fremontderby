import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { progressiveReleaseGateResponse } from '../src/progressiveReleaseGate.js';

const gatedEnv = { PROGRESSIVE_RELEASE_GATE: '0', ENVIRONMENT: 'jfl' };

test('Gate 0 serves only a minimal root baseline and leaves health to the worker', async () => {
  const root = progressiveReleaseGateResponse(new Request('https://jfl.example.test/'), gatedEnv);
  assert.ok(root);
  assert.equal(root.status, 200);
  assert.match(root.headers.get('content-type'), /text\/html/);
  const html = await root.text();
  assert.match(html, /Gate 0 is active/i);
  assert.match(html, /Only deployment health checks are enabled/i);
  assert.doesNotMatch(html, /Teams|Standings|Scorecard|Messages|Profile|Season Setup/i);

  assert.equal(
    progressiveReleaseGateResponse(new Request('https://jfl.example.test/health'), gatedEnv),
    null,
  );
  assert.equal(
    progressiveReleaseGateResponse(new Request('https://jfl.example.test/health/environment'), gatedEnv),
    null,
  );
});

test('Gate 0 blocks browser deep links with a plain unavailable page', async () => {
  for (const path of ['/teams', '/standings', '/scorecard', '/messages', '/profile', '/season-setup', '/admin/operations']) {
    const response = progressiveReleaseGateResponse(new Request(`https://jfl.example.test${path}`), gatedEnv);
    assert.ok(response, path);
    assert.equal(response.status, 404, path);
    assert.match(response.headers.get('content-type'), /text\/html/, path);
    const body = await response.text();
    assert.match(body, /Not available yet/i, path);
    assert.doesNotMatch(body, /Supabase|UUID|bearer|token|service role/i, path);
  }
});

test('Gate 0 blocks trusted API and internal paths before application handlers run', async () => {
  for (const [method, path] of [
    ['GET', '/api/me/scorable-matches'],
    ['POST', '/api/teams/example/membership-requests'],
    ['POST', '/api/player-matches/example/finalize-reconciled'],
    ['GET', '/internal/hourly-probe'],
  ]) {
    const response = progressiveReleaseGateResponse(new Request(`https://jfl.example.test${path}`, { method }), gatedEnv);
    assert.ok(response, `${method} ${path}`);
    assert.equal(response.status, 404, `${method} ${path}`);
    assert.match(response.headers.get('content-type'), /application\/json/, `${method} ${path}`);
    const payload = await response.json();
    assert.match(payload.error, /not available/i);
  }
});

test('Gate 0 is opt-in and JFL is the only configured lane', async () => {
  assert.equal(
    progressiveReleaseGateResponse(new Request('https://example.test/teams'), {}),
    null,
  );

  const raw = await readFile(new URL('../wrangler.jsonc', import.meta.url), 'utf8');
  const config = JSON.parse(raw);
  assert.equal(config.main, 'src/progressiveReleaseEntry.js');
  assert.equal(config.env.jfl.vars.PROGRESSIVE_RELEASE_GATE, '0');
  assert.equal(config.env.dru.vars.PROGRESSIVE_RELEASE_GATE, undefined);
  assert.equal(config.env.gamma.vars.PROGRESSIVE_RELEASE_GATE, undefined);
  assert.equal(config.vars.PROGRESSIVE_RELEASE_GATE, undefined);
});
