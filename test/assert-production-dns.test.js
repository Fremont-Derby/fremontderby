import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveViaDoh,
  assertHostnameResolves,
  assertProductionDnsAndHealth,
} from '../scripts/assert-production-dns.mjs';

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
