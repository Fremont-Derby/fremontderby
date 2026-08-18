import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function loadWrangler() {
  const raw = readFileSync('wrangler.jsonc', 'utf8');
  return JSON.parse(raw.replace(/\/\/.*$/gm, ''));
}

test('wrangler top-level identity is fremontderby + routerEntry', () => {
  const cfg = loadWrangler();
  assert.equal(cfg.name, 'fremontderby');
  assert.equal(cfg.main, 'src/routerEntry.js');
  assert.equal(cfg.compatibility_date, '2026-08-09');
});

test('hourly cron trigger remains configured', () => {
  const cfg = loadWrangler();
  assert.deepEqual(cfg.triggers.crons, ['0 * * * *']);
});
