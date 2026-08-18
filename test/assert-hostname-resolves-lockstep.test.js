import test from 'node:test';
import assert from 'node:assert/strict';
import { assertHostnameResolves } from '../scripts/assert-production-dns.mjs';

test('assertHostnameResolves ok when A record present', async () => {
  const fetchImpl = async (url) => {
    const type = String(url).includes('type=AAAA') ? 'AAAA' : 'A';
    return {
      ok: true,
      json: async () => ({
        Status: 0,
        Answer: type === 'A' ? [{ type: 1, data: '1.2.3.4' }] : [],
      }),
    };
  };
  const result = await assertHostnameResolves('fremontderby.com', fetchImpl);
  assert.equal(result.ok, true);
  assert.deepEqual(result.a, ['1.2.3.4']);
});

test('assertHostnameResolves fails when no A/AAAA', async () => {
  const fetchImpl = async () => ({
    ok: true,
    json: async () => ({ Status: 0, Answer: [] }),
  });
  const result = await assertHostnameResolves('missing.example', fetchImpl);
  assert.equal(result.ok, false);
  assert.match(result.error, /no A\/AAAA/);
});
