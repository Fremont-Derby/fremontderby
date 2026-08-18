import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function loadWrangler() {
  const raw = readFileSync('wrangler.jsonc', 'utf8');
  return JSON.parse(raw.replace(/\/\/.*$/gm, ''));
}

test('top-level workers_dev and preview_urls are false', () => {
  const cfg = loadWrangler();
  assert.equal(cfg.workers_dev, false);
  assert.equal(cfg.preview_urls, false);
});

test('lane envs keep workers_dev and preview_urls false', () => {
  const cfg = loadWrangler();
  for (const lane of ['jfl', 'dru', 'gamma', 'staging']) {
    assert.equal(cfg.env[lane].workers_dev, false, lane);
    assert.equal(cfg.env[lane].preview_urls, false, lane);
  }
});
