import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function loadWrangler() {
  const raw = readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8');
  const json = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  return JSON.parse(json);
}

test('top-level workers_dev and preview_urls are disabled', () => {
  const cfg = loadWrangler();
  assert.equal(cfg.workers_dev, false);
  assert.equal(cfg.preview_urls, false);
});
