import test from 'node:test';
import assert from 'node:assert/strict';
import { isCloudflareChallengeBody, validateGammaRc } from '../scripts/validate-gamma-rc.mjs';

test('isCloudflareChallengeBody detects classic challenge HTML', () => {
  assert.equal(
    isCloudflareChallengeBody('<!DOCTYPE html><html><title>Just a moment...</title>', 403),
    true,
  );
  assert.equal(isCloudflareChallengeBody('{"ok":true}', 200), false);
});

test('validateGammaRc uses injected fetchImpl and passes a healthy gamma host', async () => {
  const fetchImpl = async (url) => {
    if (String(url).endsWith('/health/environment')) {
      return {
        status: 200,
        text: async () => JSON.stringify({
          ok: true,
          environment: 'gamma',
          hostMatchesEnvironment: true,
          versionTag: 'a'.repeat(40),
        }),
      };
    }
    if (String(url).endsWith('/')) {
      return {
        status: 200,
        text: async () => '<html><body>Fremont Derby League</body></html>',
      };
    }
    if (String(url).includes('/api/seasons')) {
      return {
        status: 200,
        text: async () => JSON.stringify({ seasons: [{ id: 1 }] }),
      };
    }
    if (String(url).includes('/api/me/profile')) {
      return {
        status: 401,
        text: async () => JSON.stringify({ error: 'Unauthorized' }),
      };
    }
    throw new Error(`unexpected url ${url}`);
  };

  const result = await validateGammaRc({
    baseUrl: 'https://gamma.fremontderby.com',
    fetchImpl,
  });
  assert.equal(result.ok, true, result.errors.join('; '));
  assert.equal(result.environment, 'gamma');
  assert.equal(result.versionTag, 'a'.repeat(40));
});

test('validateGammaRc fails closed with a clear challenge error', async () => {
  const fetchImpl = async () => ({
    status: 403,
    text: async () => '<!DOCTYPE html><html lang="en-US"><head><title>Just a moment...</title>',
  });
  const result = await validateGammaRc({
    baseUrl: 'https://gamma.fremontderby.com',
    fetchImpl,
  });
  assert.equal(result.ok, false);
  assert.ok(
    result.errors.some((e) => /Cloudflare challenge/i.test(e)),
    result.errors.join('; '),
  );
});
