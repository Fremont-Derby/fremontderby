import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_GAMMA_BASE_URL,
  normalizeGammaBaseUrl,
  versionTagMatches,
  validateGammaRc,
} from '../scripts/validate-gamma-rc.mjs';

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

test('normalizeGammaBaseUrl defaults and strips trailing slashes', () => {
  assert.equal(normalizeGammaBaseUrl(''), DEFAULT_GAMMA_BASE_URL);
  assert.equal(normalizeGammaBaseUrl('https://gamma.fremontderby.com/'), 'https://gamma.fremontderby.com');
});

test('versionTagMatches allows full, prefix, and short SHA overlap', () => {
  const full = 'abcdef0123456789abcdef0123456789abcdef01';
  assert.equal(versionTagMatches(full, full), true);
  assert.equal(versionTagMatches(full, full.slice(0, 7)), true);
  assert.equal(versionTagMatches(full.slice(0, 7), full), true);
  assert.equal(versionTagMatches('', 'abc'), false);
  assert.equal(versionTagMatches('zzzzzzz', 'abcdef0'), false);
  assert.equal(versionTagMatches('anything', ''), true);
});

test('validateGammaRc passes healthy gamma fixture via injected fetch', async () => {
  const result = await validateGammaRc({
    baseUrl: 'https://gamma.fremontderby.com',
    expectedVersionTag: 'abc1234',
    fetchImpl: async (url) => {
      if (url.endsWith('/health/environment')) {
        return jsonResponse({
          ok: true,
          environment: 'gamma',
          hostMatchesEnvironment: true,
          versionTag: 'abc1234deadbeef',
        });
      }
      if (url.endsWith('/')) {
        return new Response('<!doctype html><title>Fremont Derby</title>', { status: 200 });
      }
      if (url.endsWith('/api/seasons')) {
        return jsonResponse({ seasons: [{ id: 1 }] });
      }
      if (url.endsWith('/api/me/profile')) {
        return jsonResponse({ profile: null }, 401);
      }
      throw new Error(`unexpected ${url}`);
    },
  });
  assert.equal(result.ok, true);
  assert.equal(result.environment, 'gamma');
});

test('validateGammaRc fails closed on production identity or not-ok readiness', async () => {
  const result = await validateGammaRc({
    fetchImpl: async (url) => {
      if (url.endsWith('/health/environment')) {
        return jsonResponse({
          ok: false,
          environment: 'production',
          hostMatchesEnvironment: false,
          checks: [{ name: 'supabase', ok: false }],
        });
      }
      if (url.endsWith('/')) {
        return new Response('<html>fremont</html>', { status: 200 });
      }
      if (url.endsWith('/api/seasons')) {
        return jsonResponse({ seasons: [] });
      }
      if (url.endsWith('/api/me/profile')) {
        return jsonResponse({}, 401);
      }
      throw new Error(`unexpected ${url}`);
    },
  });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => /expected "gamma"/.test(e)));
  assert.ok(result.errors.some((e) => /not ok/.test(e)));
  assert.ok(result.errors.some((e) => /hostMatchesEnvironment/.test(e)));
});

test('validateGammaRc fails on version tag mismatch when expected', async () => {
  const result = await validateGammaRc({
    expectedVersionTag: 'deadbeef',
    fetchImpl: async (url) => {
      if (url.endsWith('/health/environment')) {
        return jsonResponse({
          ok: true,
          environment: 'gamma',
          hostMatchesEnvironment: true,
          versionTag: 'cafebabe',
        });
      }
      if (url.endsWith('/')) {
        return new Response('Fremont Derby league', { status: 200 });
      }
      if (url.endsWith('/api/seasons')) {
        return jsonResponse({ seasons: [] });
      }
      if (url.endsWith('/api/me/profile')) {
        return jsonResponse({}, 401);
      }
      throw new Error(`unexpected ${url}`);
    },
  });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => /version tag mismatch/.test(e)));
});
