import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { progressiveReleaseGateResponse } from '../src/progressiveReleaseGate.js';

const env = { PROGRESSIVE_RELEASE_GATE: '0', ENVIRONMENT: 'jfl' };

test('Gate 0 leaves only root and health available', async () => {
  const root = progressiveReleaseGateResponse(new Request('https://jfl.example.test/'), env);
  assert.equal(root.status, 200);
  assert.match(await root.text(), /Gate 0 is active/i);
  assert.equal(progressiveReleaseGateResponse(new Request('https://jfl.example.test/health'), env), null);
  assert.equal(progressiveReleaseGateResponse(new Request('https://jfl.example.test/health/environment'), env), null);

  for (const path of ['/teams', '/standings', '/scorecard', '/messages', '/profile', '/season-setup', '/admin/operations']) {
    const response = progressiveReleaseGateResponse(new Request(`https://jfl.example.test${path}`), env);
    assert.equal(response.status, 404, path);
    assert.match(await response.text(), /Not available yet/i, path);
  }
});

test('Gate 0 blocks APIs and internal commands before normal routing', async () => {
  for (const [method, path] of [
    ['GET', '/api/me/scorable-matches'],
    ['POST', '/api/teams/example/membership-requests'],
    ['POST', '/api/player-matches/example/finalize-reconciled'],
    ['GET', '/internal/hourly-probe'],
  ]) {
    const response = progressiveReleaseGateResponse(new Request(`https://jfl.example.test${path}`, { method }), env);
    assert.equal(response.status, 404, `${method} ${path}`);
    assert.match(response.headers.get('content-type'), /application\/json/);
    assert.match((await response.json()).error, /not available/i);
  }
});

test('Gate 0 is JFL-only in Wrangler config and production entrypoint is unchanged', async () => {
  assert.equal(progressiveReleaseGateResponse(new Request('https://example.test/teams'), {}), null);
  const config = JSON.parse(await readFile(new URL('../wrangler.jsonc', import.meta.url), 'utf8'));
  assert.equal(config.main, 'src/routerEntry.js');
  assert.equal(config.vars.ENVIRONMENT, 'production');
  assert.equal(config.env.jfl.main, 'src/progressiveReleaseEntry.js');
  assert.equal(config.env.jfl.vars.PROGRESSIVE_RELEASE_GATE, '0');
  assert.equal(config.env.dru.vars.PROGRESSIVE_RELEASE_GATE, undefined);
  assert.equal(config.env.gamma.vars.PROGRESSIVE_RELEASE_GATE, undefined);
});
