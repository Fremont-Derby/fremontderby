import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../scripts/put-wrangler-secret.mjs', import.meta.url), 'utf8');

test('put-wrangler-secret invokes classic wrangler secret put', () => {
  assert.match(source, /run\(\[\s*'--yes',\s*'wrangler@4',\s*'secret',\s*'put'/);
});

test('put-wrangler-secret never spawns versions secret put', () => {
  // Comment may mention the forbidden path; the spawn arg list must not include it.
  assert.doesNotMatch(source, /run\([^)]*'versions'[^)]*\)/);
  assert.match(source, /not falling back to versions secret put/);
});
