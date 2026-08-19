import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/**
 * Top-level wrangler.jsonc invariants required for:
 * - correct Worker entry (#1440)
 * - no public workers.dev surface (#1430)
 * - hourly live probe / cron schedule (#1441)
 */
function loadWranglerTopLevel() {
  const raw = readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8');
  // Strip // line comments so JSON.parse can succeed on the jsonc file.
  const jsonish = raw.replace(/^\s*\/\/.*$/gm, '');
  return JSON.parse(jsonish);
}

test('wrangler main entry is src/routerEntry.js', () => {
  const cfg = loadWranglerTopLevel();
  assert.equal(cfg.main, 'src/routerEntry.js');
});

test('wrangler top-level workers_dev and preview_urls are false', () => {
  const cfg = loadWranglerTopLevel();
  assert.equal(cfg.workers_dev, false);
  assert.equal(cfg.preview_urls, false);
});

test('wrangler top-level hourly cron is present', () => {
  const cfg = loadWranglerTopLevel();
  assert.ok(Array.isArray(cfg.triggers?.crons));
  assert.ok(
    cfg.triggers.crons.includes('0 * * * *'),
    `expected hourly cron "0 * * * *"; got ${JSON.stringify(cfg.triggers?.crons)}`,
  );
});

test('every named lane env also disables workers_dev', () => {
  const cfg = loadWranglerTopLevel();
  const envs = cfg.env || {};
  for (const lane of ['jfl', 'dru', 'gamma', 'staging']) {
    assert.ok(envs[lane], `missing env.${lane}`);
    assert.equal(
      envs[lane].workers_dev,
      false,
      `env.${lane}.workers_dev must be false`,
    );
  }
});
