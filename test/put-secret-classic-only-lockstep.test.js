import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('put-wrangler-secret uses classic secret put only', () => {
  const source = readFileSync('scripts/put-wrangler-secret.mjs', 'utf8');
  assert.match(source, /wrangler@4',
    'secret',
    'put'/);
  assert.match(source, /not falling back to versions secret put/);
  assert.doesNotMatch(source, /versions secret put/);
});

test('put-wrangler-secret documents versionTag risk', () => {
  const source = readFileSync('scripts/put-wrangler-secret.mjs', 'utf8');
  assert.match(source, /versionTag loss/);
  assert.match(source, /Do not use `versions secret put`/);
});
