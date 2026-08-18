import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PRODUCTION_DNS_HOSTS,
  resolveViaDoh,
  assertHostnameResolves,
  assertProductionDnsAndHealth,
} from '../scripts/assert-production-dns.mjs';
import { HOST_ENVIRONMENT_EXPECTATIONS } from '../src/hostEnvironment.js';

test('PRODUCTION_DNS_HOSTS is derived from hostEnvironment production hosts', () => {
  const expected = Object.entries(HOST_ENVIRONMENT_EXPECTATIONS)
    .filter(([, env]) => env === 'production')
    .map(([host]) => host);
  assert.deepEqual([...PRODUCTION_DNS_HOSTS], expected);
});

test('resolveViaDoh maps Answer data', async () => {
  const fetchImpl = async () => ({
    ok: true,
    async json() {
      return {
        Status: 0,
        Answer: [
          { type: 1, data: '1.2.3.4' },
          { type: 1, data: '5.6.7.8' },
        ],
      };
    },
  });
  const result = await resolveViaDoh('fremontderby.com', 'A', fetchImpl);
  assert.equal(result.ok, true);
  assert.deepEqual(result.records, ['1.2.3.4', '5.6.7.8']);
});

test('assertProductionDnsAndHealth fails closed on empty DNS', async () => {
  const fetchImpl = async (url) => {
    if (String(url).includes('dns-query')) {
      return {
        ok: true,
        async json() {
          return { Status: 0, Answer: [] };
        },
      };
    }
    throw new Error('should not HTTP when DNS empty');
  };
  const summary = await assertProductionDnsAndHealth({
    hosts: ['fremontderby.com'],
    fetchImpl,
  });
  assert.equal(summary.ok, false);
  assert.equal(summary.dnsFailed.length, 1);
});
