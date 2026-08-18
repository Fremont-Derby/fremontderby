import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('put-wrangler-secret uses classic secret put only', () => {
  const source = readFileSync('scripts/put-wrangler-secret.mjs', 'utf8');
  assert.match(source, /secret', 'put'/);
  assert.match(source, /classic secret put/);
  assert.match(source, /not falling back to versions secret put/);
  assert.doesNotMatch(source, /'versions',\s*'secret'/);
});
