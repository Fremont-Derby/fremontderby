import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_GAMMA_BASE_URL,
  normalizeBaseUrl,
  versionTagMatches,
  validateGammaRc,
} from '../scripts/validate-gamma-rc.mjs';

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function htmlResponse(text, status = 200) {
  return new Response(text, { status, headers: { 'content-type': 'text/html' } });
}

test('normalizeBaseUrl strips trailing slashes and defaults to gamma host', () => {
  assert.equal(normalizeBaseUrl('https://gamma.fremontderby.com/'), 'https://gamma.fremontderby.com');
  assert.equal(normalizeBaseUrl(''), DEFAULT_GAMMA_BASE_URL);
});

test('versionTagMatches allows full SHA, short prefix, and empty expected', () => {
  const full = 'abcdef0123456789abcdef0123456789abcdef01';
  assert.equal(versionTagMatches(full, ''), true);
  assert.equal(versionTagMatches(full, full), true);
  assert.equal(versionTagMatches(full, full.slice(0, 7)), true);
  assert.equal(versionTagMatches(full.slice(0, 7), full), true);
  assert.equal(versionTagMatches('', 'abc'), false);
  assert.equal(versionTagMatches('zzzzzzz', 'abcdef0'), false);
});

test('validateGammaRc passes when gamma identity and public surfaces are healthy', async () => {
  const result = await validateGammaRc({
    baseUrl: 'https://gamma.fremontderby.com',
    expectedVersionTag: 'abcdef0',
    fetchImpl: async (url) => {
      if (url.endsWith('/health/environment')) {
        return jsonResponse({
          ok: true,
          environment: 'gamma',
          hostMatchesEnvironment: true,
          versionTag: 'abcdef0123456789',
        });
      }
      if (url.endsWith('/')) return htmlResponse('<!doctype html><title>Fremont Derby</title>');
      if (url.endsWith('/api/seasons')) return jsonResponse({ seasons: [{ id: 1 }] });
      if (url.endsWith('/api/me/profile')) return jsonResponse({ profile: null }, 401);
      throw new Error(`unexpected url ${url}`);
    },
  });
  assert.equal(result.ok, true);
  assert.equal(result.environment, 'gamma');
  assert.equal(result.errors.length, 0);
});

test('validateGammaRc fails closed on production identity or bad home shell', async () => {
  const result = await validateGammaRc({
    fetchImpl: async (url) => {
      if (url.endsWith('/health/environment')) {
        return jsonResponse({
          ok: true,
          environment: 'production',
          hostMatchesEnvironment: false,
          versionTag: 'x',
        });
      }
      if (url.endsWith('/')) return htmlResponse('<html>nope</html>', 200);
      if (url.endsWith('/api/seasons')) return jsonResponse({ seasons: [] }, 500);
      if (url.endsWith('/api/me/profile')) return jsonResponse({}, 401);
      throw new Error(`unexpected url ${url}`);
    },
  });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => /expected "gamma"/.test(e)));
  assert.ok(result.errors.some((e) => /hostMatchesEnvironment/.test(e)));
  assert.ok(result.errors.some((e) => /home page/.test(e)));
  assert.ok(result.errors.some((e) => /\/api\/seasons HTTP 500/.test(e)));
});
