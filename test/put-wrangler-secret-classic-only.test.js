import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../scripts/put-wrangler-secret.mjs', import.meta.url), 'utf8');

test('put-wrangler-secret uses classic wrangler secret put', () => {
  assert.match(source, /['"]secret['"],\s*['"]put['"]/);
  assert.match(source, /wrangler@4/);
});

test('put-wrangler-secret never falls back to versions secret put', () => {
  assert.doesNotMatch(source, /versions\s+secret\s+put/);
  assert.match(source, /not falling back to versions secret put/);
});
