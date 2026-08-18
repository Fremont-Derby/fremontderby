import test from 'node:test';
import assert from 'node:assert/strict';
import { assertHostnameHealth } from '../scripts/assert-production-dns.mjs';

test('assertHostnameHealth requires HTTP 2xx and body.ok true', async () => {
  const okFetch = async () => ({
    status: 200,
    text: async () => JSON.stringify({ ok: true }),
  });
  const ok = await assertHostnameHealth('fremontderby.com', okFetch);
  assert.equal(ok.ok, true);

  const badFetch = async () => ({
    status: 200,
    text: async () => JSON.stringify({ ok: false }),
  });
  const bad = await assertHostnameHealth('fremontderby.com', badFetch);
  assert.equal(bad.ok, false);
});
