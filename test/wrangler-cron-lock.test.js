import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function loadWrangler() {
  const raw = readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8');
  const json = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  return JSON.parse(json);
}

test('wrangler declares hourly cron trigger', () => {
  const cfg = loadWrangler();
  assert.ok(Array.isArray(cfg.triggers?.crons));
  assert.ok(cfg.triggers.crons.includes('0 * * * *'));
});
