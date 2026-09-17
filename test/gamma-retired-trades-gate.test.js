import assert from 'node:assert/strict';
import test from 'node:test';
import { isRetiredTradePath } from '../src/retiredTradesGate.js';
import { aliasRedirect, PUBLIC_PATH_ALIASES } from '../src/publicPathAliases.js';

test('gamma retires the trades page and trade APIs', () => {
  assert.equal(isRetiredTradePath('/trades'), true);
  assert.equal(isRetiredTradePath('/api/me/trades'), true);
  assert.equal(isRetiredTradePath('/api/teams/abc/trades'), true);
  assert.equal(isRetiredTradePath('/teams'), false);
});

test('gamma /trade aliases onto teams instead of trades', () => {
  assert.equal(PUBLIC_PATH_ALIASES['/trade'], '/teams');
});

test('gamma alias gate 404s /trades', () => {
  const response = aliasRedirect(
    new Request('https://gamma.fremontderby.test/trades'),
    new URL('https://gamma.fremontderby.test/trades'),
  );
  assert.equal(response.status, 404);
});

test('gamma alias gate 404s /api/me/trades', () => {
  const response = aliasRedirect(
    new Request('https://gamma.fremontderby.test/api/me/trades'),
    new URL('https://gamma.fremontderby.test/api/me/trades'),
  );
  assert.equal(response.status, 404);
});
