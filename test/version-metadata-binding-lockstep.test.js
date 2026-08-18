import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function loadWrangler() {
  const raw = readFileSync('wrangler.jsonc', 'utf8');
  return JSON.parse(raw.replace(/\/\/.*$/gm, ''));
}

test('top-level version_metadata binds CF_VERSION_METADATA', () => {
  const cfg = loadWrangler();
  assert.equal(cfg.version_metadata.binding, 'CF_VERSION_METADATA');
});

test('lane version_metadata binds CF_VERSION_METADATA', () => {
  const cfg = loadWrangler();
  for (const lane of ['jfl', 'dru', 'gamma']) {
    assert.equal(cfg.env[lane].version_metadata.binding, 'CF_VERSION_METADATA', lane);
  }
});
