import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateGammaRc,
  isCloudflareChallenge,
  normalizeBaseUrl,
} from '../scripts/validate-gamma-rc.mjs';

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

function html(body, status = 200, headers = {}) {
  return new Response(body, {
    status,
    headers: { 'content-type': 'text/html', ...headers },
  });
}

function healthyFetch() {
  return async (url) => {
    if (String(url).endsWith('/health/environment')) {
      return json({
        ok: true,
        environment: 'gamma',
        versionTag: 'abc1234deadbeef',
        hostMatchesEnvironment: true,
        checks: [],
      });
    }
    if (String(url).endsWith('/api/seasons')) {
      return json({ seasons: [{ id: 1 }] });
    }
    if (String(url).endsWith('/api/me/profile')) {
      return json({ error: 'unauthorized' }, 401);
    }
    if (String(url).endsWith('/') || String(url).match(/\.com\/?$/)) {
      return html('<!doctype html><title>Fremont Derby</title><h1>League</h1>');
    }
    throw new Error(`unexpected ${url}`);
  };
}

test('normalizeBaseUrl strips trailing slashes', () => {
  assert.equal(normalizeBaseUrl('https://gamma.fremontderby.com/'), 'https://gamma.fremontderby.com');
});

test('isCloudflareChallenge detects 403 Just a moment pages', () => {
  const response = html('<title>Just a moment...</title>', 403, { server: 'cloudflare' });
  // Response body already consumed pattern — pass text directly
  assert.equal(
    isCloudflareChallenge(
      { status: 403, headers: { get: (n) => (n === 'server' ? 'cloudflare' : null) } },
      '<title>Just a moment...</title>',
    ),
    true,
  );
  assert.equal(
    isCloudflareChallenge(
      { status: 200, headers: { get: () => null } },
      '<!doctype html>',
    ),
    false,
  );
});

test('validateGammaRc passes for healthy gamma with injected fetch', async () => {
  const result = await validateGammaRc({
    baseUrl: 'https://gamma.fremontderby.com',
    expectedVersionTag: 'abc1234',
    fetchImpl: healthyFetch(),
  });
  assert.equal(result.ok, true);
  assert.equal(result.environment, 'gamma');
  assert.equal(result.versionTag, 'abc1234deadbeef');
});

test('validateGammaRc fails when environment is not gamma', async () => {
  const result = await validateGammaRc({
    fetchImpl: async (url) => {
      if (String(url).includes('/health/environment')) {
        return json({ ok: true, environment: 'production', hostMatchesEnvironment: true });
      }
      if (String(url).includes('/api/seasons')) return json({ seasons: [] });
      return html('<!doctype html>Fremont Derby');
    },
  });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => /expected "gamma"/.test(e)));
});

test('validateGammaRc throws on Cloudflare challenge via fetchImpl', async () => {
  await assert.rejects(
    () => validateGammaRc({
      fetchImpl: async () => html('<title>Just a moment...</title>', 403, { server: 'cloudflare' }),
    }),
    /Cloudflare challenge/,
  );
});
