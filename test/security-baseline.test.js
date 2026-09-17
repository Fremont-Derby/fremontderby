import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyScriptNonces,
  assertBetaBypassLane,
  createRequestNonce,
  htmlSecurityHeaders,
  apiSecurityHeaders,
} from '../src/securityHeaders.js';
import { betaAuthBypassEnabled } from '../src/supabaseAuth.js';
import { decorateHtmlWithShell } from '../src/appShell.js';

test('nonce is applied to script tags', () => {
  const html = applyScriptNonces('<script>1</script><script src="/x.js"></script>', 'n0nce');
  assert.equal((html.match(/nonce="n0nce"/g) || []).length, 2);
});

test('html security headers include CSP and frame denial', () => {
  const h = htmlSecurityHeaders('abc');
  assert.match(h['content-security-policy'], /nonce-abc/);
  assert.equal(h['x-frame-options'], 'DENY');
  assert.equal(h['x-content-type-options'], 'nosniff');
});

test('api security headers are strict about caching and framing', () => {
  const h = apiSecurityHeaders();
  assert.match(h['cache-control'], /no-store/);
  assert.equal(h['x-frame-options'], 'DENY');
});

test('beta bypass refuses non-test environments', () => {
  assert.throws(() => assertBetaBypassLane({ BETA_AUTH_BYPASS: '1', ENVIRONMENT: 'production' }));
  assert.equal(betaAuthBypassEnabled({ BETA_AUTH_BYPASS: '1', ENVIRONMENT: 'gamma' }), true);
  assert.equal(betaAuthBypassEnabled({ BETA_AUTH_BYPASS: '1', ENVIRONMENT: 'jfl' }), true);
  assert.equal(betaAuthBypassEnabled({ BETA_AUTH_BYPASS: '1', ENVIRONMENT: 'production' }), false);
  assert.equal(betaAuthBypassEnabled({ BETA_AUTH_BYPASS: '0', ENVIRONMENT: 'production' }), false);
});

test('decorateHtmlWithShell stamps shell scripts with nonce', () => {
  const nonce = createRequestNonce();
  const out = decorateHtmlWithShell(
    '<!doctype html><html><head></head><body><h1>x</h1></body></html>',
    '/teams',
    { nonce },
  );
  assert.ok(out.includes(`nonce="${nonce}"`));
});
