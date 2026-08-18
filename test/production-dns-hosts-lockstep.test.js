import test from 'node:test';
import assert from 'node:assert/strict';
import { PRODUCTION_DNS_HOSTS } from '../scripts/assert-production-dns.mjs';

test('PRODUCTION_DNS_HOSTS is apex and www only', () => {
  assert.deepEqual([...PRODUCTION_DNS_HOSTS], ['fremontderby.com', 'www.fremontderby.com']);
  assert.equal(Object.isFrozen(PRODUCTION_DNS_HOSTS), true);
});
