import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('put-wrangler-secret invokes classic secret put', () => {
  const source = readFileSync('scripts/put-wrangler-secret.mjs', 'utf8');
  assert.match(source, /'wrangler@4'/);
  assert.match(source, /'secret'/);
  assert.match(source, /'put'/);
  assert.match(source, /not falling back to versions secret put/);
});

test('put-wrangler-secret documents versionTag risk and forbids versions path', () => {
  const source = readFileSync('scripts/put-wrangler-secret.mjs', 'utf8');
  assert.match(source, /versionTag loss/);
  assert.match(source, /Do not use `versions secret put`/);
  // Must not spawn versions secret put as an executable fallback path
  assert.doesNotMatch(source, /run\([^)]*versions[^)]*secret[^)]*put/);
});
