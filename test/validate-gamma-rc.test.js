import test from 'node:test';
import assert from 'node:assert/strict';
import { validateGammaRc } from '../scripts/validate-gamma-rc.mjs';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function html(body, status = 200, headers = {}) {
  return new Response(body, {
    status,
    headers: { 'content-type': 'text/html', ...headers },
  });
}

test('validateGammaRc uses injected fetchImpl for happy path', async () => {
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(String(url));
    if (String(url).endsWith('/health/environment')) {
      return json({
        ok: true,
        environment: 'gamma',
        hostMatchesEnvironment: true,
        versionTag: 'abc1234',
      });
    }
    if (String(url).endsWith('/')) {
      return html('<!doctype html><title>Fremont Derby</title>');
    }
    if (String(url).endsWith('/api/seasons')) {
      return json({ seasons: [{ id: 1 }] });
    }
    if (String(url).endsWith('/api/me/profile')) {
      return json({ profile: null }, 401);
    }
    throw new Error(`unexpected ${url}`);
  };

  const result = await validateGammaRc({
    baseUrl: 'https://gamma.fremontderby.com',
    fetchImpl,
  });

  assert.equal(result.ok, true);
  assert.equal(result.environment, 'gamma');
  assert.equal(result.versionTag, 'abc1234');
  assert.ok(calls.some((u) => u.includes('/health/environment')));
  assert.ok(calls.some((u) => u.endsWith('/api/seasons')));
});

test('validateGammaRc reports Cloudflare challenge clearly', async () => {
  const fetchImpl = async () =>
    html('<!doctype html><title>Just a moment...</title>', 403, {
      server: 'cloudflare',
    });

  await assert.rejects(
    () => validateGammaRc({ baseUrl: 'https://gamma.fremontderby.com', fetchImpl }),
    /Cloudflare challenge/,
  );
});

test('validateGammaRc fails when environment is not gamma', async () => {
  const fetchImpl = async (url) => {
    if (String(url).endsWith('/health/environment')) {
      return json({ ok: true, environment: 'production', hostMatchesEnvironment: true });
    }
    if (String(url).endsWith('/')) {
      return html('<!doctype html>Fremont Derby');
    }
    if (String(url).endsWith('/api/seasons')) {
      return json({ seasons: [] });
    }
    return json({}, 404);
  };

  const result = await validateGammaRc({
    baseUrl: 'https://gamma.fremontderby.com',
    fetchImpl,
  });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => /expected "gamma"/.test(e)));
});
