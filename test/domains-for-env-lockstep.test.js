import test from 'node:test';
import assert from 'node:assert/strict';
import { domainsForEnv } from '../scripts/lane-custom-domains.mjs';

test('domainsForEnv filters by env name', () => {
  const prod = domainsForEnv('production').map((r) => r.hostname).sort();
  assert.deepEqual(prod, ['fremontderby.com', 'www.fremontderby.com']);
  assert.deepEqual(domainsForEnv('dru').map((r) => r.hostname), ['dru.fremontderby.com']);
  assert.deepEqual(domainsForEnv('missing'), []);
});
