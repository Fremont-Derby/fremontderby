import test from 'node:test';
import assert from 'node:assert/strict';
import { PRODUCTION_DNS_HOSTS } from '../scripts/assert-production-dns.mjs';

test('PRODUCTION_DNS_HOSTS is frozen and lists apex + www only', () => {
  assert.equal(Object.isFrozen(PRODUCTION_DNS_HOSTS), true);
  assert.deepEqual([...PRODUCTION_DNS_HOSTS].sort(), [
    'fremontderby.com',
    'www.fremontderby.com',
  ]);
});

test('PRODUCTION_DNS_HOSTS does not include lane hosts', () => {
  assert.equal(PRODUCTION_DNS_HOSTS.includes('jfl.fremontderby.com'), false);
  assert.equal(PRODUCTION_DNS_HOSTS.includes('dru.fremontderby.com'), false);
  assert.equal(PRODUCTION_DNS_HOSTS.includes('gamma.fremontderby.com'), false);
});
