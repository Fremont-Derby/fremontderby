import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function loadWrangler() {
  const raw = readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8');
  const json = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  return JSON.parse(json);
}

test('wrangler main entry is routerEntry.js', () => {
  const cfg = loadWrangler();
  assert.equal(cfg.main, 'src/routerEntry.js');
  assert.ok(cfg.compatibility_date);
});
