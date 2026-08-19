import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PRODUCTION_DNS_HOSTS,
  resolveViaDoh,
  assertHostnameResolves,
  assertHostnameHealth,
  assertProductionDnsAndHealth,
} from '../scripts/assert-production-dns.mjs';

test('PRODUCTION_DNS_HOSTS is frozen apex + www only', () => {
  assert.deepEqual([...PRODUCTION_DNS_HOSTS], ['fremontderby.com', 'www.fremontderby.com']);
  assert.equal(Object.isFrozen(PRODUCTION_DNS_HOSTS), true);
});

test('resolveViaDoh parses A records and fails closed on empty answers', async () => {
  const ok = await resolveViaDoh('fremontderby.com', 'A', async (url) => {
    assert.match(url, /name=fremontderby\.com/);
    assert.match(url, /type=A/);
    return new Response(
      JSON.stringify({
        Status: 0,
        Answer: [{ type: 1, data: '1.2.3.4' }],
      }),
      { status: 200 },
    );
  });
  assert.equal(ok.ok, true);
  assert.deepEqual(ok.records, ['1.2.3.4']);

  const empty = await resolveViaDoh('fremontderby.com', 'A', async () =>
    new Response(JSON.stringify({ Status: 0, Answer: [] }), { status: 200 }),
  );
  assert.equal(empty.ok, false);

  await assert.rejects(
    () =>
      resolveViaDoh('fremontderby.com', 'A', async () => new Response('nope', { status: 500 })),
    /DoH HTTP 500/,
  );
});

test('assertHostnameResolves is ok when either A or AAAA is present', async () => {
  const onlyA = await assertHostnameResolves('fremontderby.com', async (url) => {
    if (url.includes('type=AAAA')) {
      return new Response(JSON.stringify({ Status: 0, Answer: [] }), { status: 200 });
    }
    return new Response(
      JSON.stringify({ Status: 0, Answer: [{ type: 1, data: '9.9.9.9' }] }),
      { status: 200 },
    );
  });
  assert.equal(onlyA.ok, true);
  assert.deepEqual(onlyA.a, ['9.9.9.9']);

  const none = await assertHostnameResolves('fremontderby.com', async () =>
    new Response(JSON.stringify({ Status: 3, Answer: [] }), { status: 200 }),
  );
  assert.equal(none.ok, false);
  assert.match(none.error, /no A\/AAAA/);
});

test('assertHostnameHealth requires 2xx JSON with ok:true', async () => {
  const healthy = await assertHostnameHealth('fremontderby.com', async (url) => {
    assert.equal(url, 'https://fremontderby.com/health');
    return new Response(JSON.stringify({ ok: true, service: 'fremontderby' }), { status: 200 });
  });
  assert.equal(healthy.ok, true);

  const badBody = await assertHostnameHealth('fremontderby.com', async () =>
    new Response(JSON.stringify({ ok: false }), { status: 200 }),
  );
  assert.equal(badBody.ok, false);

  const nonJson = await assertHostnameHealth('fremontderby.com', async () =>
    new Response('not-json', { status: 200 }),
  );
  assert.equal(nonJson.ok, false);
});

test('assertProductionDnsAndHealth skips health when DNS fails and aggregates failures', async () => {
  let healthHits = 0;
  const summary = await assertProductionDnsAndHealth({
    hosts: ['fremontderby.com', 'www.fremontderby.com'],
    fetchImpl: async (url) => {
      if (url.includes('dns-query')) {
        const name = new URL(url).searchParams.get('name');
        if (name === 'fremontderby.com') {
          return new Response(
            JSON.stringify({ Status: 0, Answer: [{ type: 1, data: '1.1.1.1' }] }),
            { status: 200 },
          );
        }
        return new Response(JSON.stringify({ Status: 3, Answer: [] }), { status: 200 });
      }
      healthHits += 1;
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    },
  });
  assert.equal(summary.ok, false);
  assert.equal(summary.dnsFailed.length, 1);
  assert.equal(summary.dnsFailed[0].hostname, 'www.fremontderby.com');
  assert.equal(healthHits, 1);
  assert.equal(summary.healthResults.length, 1);
  assert.equal(summary.healthResults[0].ok, true);
});
