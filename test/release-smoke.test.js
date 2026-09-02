import test from 'node:test';
import assert from 'node:assert/strict';

import { checkReleaseOnce, smokeRelease } from '../scripts/smoke-release.mjs';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function seasonsOk() {
  return json({ seasons: [{ id: 'season-1', name: 'Test Season', status: 'active' }] });
}

function successfulFetch(versionTag = 'abc123') {
  return async (url) => {
    if (url.endsWith('/health')) {
      return json({ ok: true, service: 'fremontderby', version: 'worker-version', versionTag });
    }
    if (url.endsWith('/health/environment')) {
      return json({
        ok: true,
        service: 'fremontderby',
        environment: 'production',
        version: 'worker-version',
        versionTag,
        checks: [{ name: 'supabaseProjectMatchesEnvironment', ok: true }],
      });
    }
    if (url.endsWith('/demo')) {
      return new Response('<h1>Try a League Night</h1>', { status: 200 });
    }
    if (url.endsWith('/api/seasons')) {
      return seasonsOk();
    }
    throw new Error(`Unexpected URL ${url}`);
  };
}

test('release smoke accepts the exact deployed Git tag and production environment', async () => {
  const result = await checkReleaseOnce({
    baseUrl: 'https://fremontderby.com/',
    expectedEnvironment: 'production',
    expectedVersionTag: 'abc123',
    fetchImpl: successfulFetch('abc123'),
  });

  assert.equal(result.ready, true);
  assert.equal(result.versionTag, 'abc123');
  assert.equal(result.environment, 'production');
  assert.equal(result.seasonCount, 1);
});

test('release smoke sends the optional bypass token to every public proof request', async () => {
  const seen = [];
  const fetchImpl = async (url, options = {}) => {
    seen.push({ url, headers: new Headers(options.headers) });
    if (url.endsWith('/health')) {
      return json({ ok: true, service: 'fremontderby', version: 'worker-version', versionTag: 'abc123' });
    }
    if (url.endsWith('/health/environment')) {
      return json({
        ok: true,
        service: 'fremontderby',
        environment: 'production',
        version: 'worker-version',
        versionTag: 'abc123',
        checks: [],
      });
    }
    if (url.endsWith('/demo')) {
      return new Response('<h1>Try a League Night</h1>', { status: 200 });
    }
    if (url.endsWith('/api/seasons')) {
      return seasonsOk();
    }
    throw new Error(`Unexpected URL ${url}`);
  };

  await checkReleaseOnce({
    baseUrl: 'https://fremontderby.com',
    expectedEnvironment: 'production',
    expectedVersionTag: 'abc123',
    bypassToken: 'secret-smoke-value',
    fetchImpl,
  });

  assert.equal(seen.length, 4);
  for (const request of seen) {
    assert.equal(request.headers.get('x-fremont-release-smoke'), 'secret-smoke-value');
  }
});

test('release smoke treats an older Worker tag as deployment still in progress', async () => {
  const result = await checkReleaseOnce({
    baseUrl: 'https://fremontderby.com',
    expectedEnvironment: 'production',
    expectedVersionTag: 'new-sha',
    fetchImpl: successfulFetch('old-sha'),
  });

  assert.equal(result.ready, false);
  assert.match(result.reason, /Waiting for Worker version tag new-sha/);
});

test('release smoke fails closed when the tagged deployment reports staging', async () => {
  const fetchImpl = async (url) => {
    if (url.endsWith('/health')) {
      return json({ ok: true, service: 'fremontderby', versionTag: 'abc123' });
    }
    if (url.endsWith('/health/environment')) {
      return json({ ok: true, service: 'fremontderby', environment: 'staging', versionTag: 'abc123' });
    }
    throw new Error(`Unexpected URL ${url}`);
  };

  await assert.rejects(
    () => checkReleaseOnce({
      baseUrl: 'https://fremontderby.com',
      expectedEnvironment: 'production',
      expectedVersionTag: 'abc123',
      fetchImpl,
    }),
    /environment mismatch/i,
  );
});

test('release smoke reports safe HTTP routing details when health is not JSON', async () => {
  const fetchImpl = async (url) => {
    if (url.endsWith('/health')) {
      return new Response('<!doctype html><title>Not found</title>', {
        status: 404,
        headers: {
          'content-type': 'text/html; charset=UTF-8',
          server: 'cloudflare',
          'cf-ray': 'abc123-SEA',
        },
      });
    }
    if (url.endsWith('/health/environment')) {
      return json({ ok: true, service: 'fremontderby', environment: 'production', versionTag: 'abc123' });
    }
    throw new Error(`Unexpected URL ${url}`);
  };

  await assert.rejects(
    () => checkReleaseOnce({
      baseUrl: 'https://fremontderby.com',
      expectedEnvironment: 'production',
      expectedVersionTag: 'abc123',
      fetchImpl,
    }),
    (error) => {
      assert.match(error.message, /\/health did not return JSON/);
      assert.match(error.message, /HTTP 404/);
      assert.match(error.message, /content-type text\/html/);
      assert.match(error.message, /server cloudflare/);
      assert.match(error.message, /cf-ray abc123-SEA/);
      assert.match(error.message, /body preview: <!doctype html><title>Not found<\/title>/);
      return true;
    },
  );
});

test('release smoke fails when public season bootstrap is not readable', async () => {
  const fetchImpl = async (url) => {
    if (url.endsWith('/health')) {
      return json({ ok: true, service: 'fremontderby', version: 'worker-version', versionTag: 'abc123' });
    }
    if (url.endsWith('/health/environment')) {
      return json({
        ok: true,
        service: 'fremontderby',
        environment: 'jfl',
        version: 'worker-version',
        versionTag: 'abc123',
        checks: [],
      });
    }
    if (url.endsWith('/demo')) {
      return new Response('<h1>Try a League Night</h1>', { status: 200 });
    }
    if (url.endsWith('/api/seasons')) {
      return json({ error: 'Method not allowed' }, 405);
    }
    throw new Error(`Unexpected URL ${url}`);
  };

  await assert.rejects(
    () => checkReleaseOnce({
      baseUrl: 'https://jfl.fremontderby.com',
      expectedEnvironment: 'jfl',
      expectedVersionTag: 'abc123',
      fetchImpl,
    }),
    /\/api\/seasons failed with HTTP 405/,
  );
});

test('release smoke fails fast when Cloudflare challenges a run with no bypass secret', async () => {
  let fetchCalls = 0;
  let sleepCalls = 0;
  const challenge = () => new Response('<!doctype html><title>Just a moment...</title>', {
    status: 403,
    headers: {
      'content-type': 'text/html; charset=UTF-8',
      server: 'cloudflare',
      'cf-ray': 'challenge-IAD',
    },
  });

  await assert.rejects(
    () => smokeRelease({
      baseUrl: 'https://fremontderby.com',
      expectedEnvironment: 'production',
      expectedVersionTag: 'abc123',
      attempts: 30,
      delayMs: 0,
      fetchImpl: async () => {
        fetchCalls += 1;
        return challenge();
      },
      sleep: async () => {
        sleepCalls += 1;
      },
      log: () => {},
    }),
    /RELEASE_SMOKE_BYPASS_TOKEN is not configured/,
  );

  assert.equal(fetchCalls, 2);
  assert.equal(sleepCalls, 0);
});

test('release smoke retries old deployments and then accepts the target release', async () => {
  let attempts = 0;
  const result = await smokeRelease({
    baseUrl: 'https://fremontderby.com',
    expectedEnvironment: 'production',
    expectedVersionTag: 'target-sha',
    attempts: 3,
    delayMs: 0,
    sleep: async () => {},
    log: () => {},
    fetchImpl: async (url) => {
      const currentTag = attempts < 2 ? 'old-sha' : 'target-sha';
      if (url.endsWith('/health')) {
        attempts += 1;
        return json({ ok: true, service: 'fremontderby', version: 'worker-version', versionTag: currentTag });
      }
      if (url.endsWith('/health/environment')) {
        return json({ ok: true, service: 'fremontderby', environment: 'production', versionTag: currentTag, checks: [] });
      }
      if (url.endsWith('/demo')) {
        return new Response('Try a League Night', { status: 200 });
      }
      if (url.endsWith('/api/seasons')) {
        return seasonsOk();
      }
      throw new Error(`Unexpected URL ${url}`);
    },
  });

  assert.equal(result.versionTag, 'target-sha');
  assert.equal(attempts, 3);
});
