import assert from 'node:assert/strict';
import test from 'node:test';
import {
  conditionalJsonResponse,
  etagMatches,
  shouldSkipBodyRender,
  strongEtagFromBody,
} from '../src/httpConditional.js';

test('strong etag is stable for identical payloads', async () => {
  const a = await strongEtagFromBody({ rounds: [{ id: '1' }], count: 1 });
  const b = await strongEtagFromBody({ rounds: [{ id: '1' }], count: 1 });
  const c = await strongEtagFromBody({ rounds: [{ id: '2' }], count: 1 });
  assert.equal(a, b);
  assert.notEqual(a, c);
  assert.match(a, /^"[a-f0-9]{64}"$/);
});

test('If-None-Match matching supports lists and weak tags', () => {
  const tag = '"abc"';
  assert.equal(etagMatches('"abc"', tag), true);
  assert.equal(etagMatches('W/"abc"', tag), true);
  assert.equal(etagMatches('"zzz", "abc"', tag), true);
  assert.equal(etagMatches('"nope"', tag), false);
  assert.equal(etagMatches('*', tag), true);
});

test('conditionalJsonResponse returns 304 when etag matches', async () => {
  const body = { standings: [{ team: 'A', wins: 1 }] };
  const first = await conditionalJsonResponse(new Request('https://example.test/api'), body);
  assert.equal(first.status, 200);
  const etag = first.headers.get('etag');
  assert.ok(etag);
  assert.equal(first.headers.get('cache-control'), 'private, no-store');

  const second = await conditionalJsonResponse(
    new Request('https://example.test/api', { headers: { 'if-none-match': etag } }),
    body,
  );
  assert.equal(second.status, 304);
  assert.equal(second.headers.get('etag'), etag);
  assert.equal(await second.text(), '');
  assert.equal(shouldSkipBodyRender(second), true);
});
