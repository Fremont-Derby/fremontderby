import assert from 'node:assert/strict';
import test from 'node:test';
import {
  conditionalJsonFromVersion,
  conditionalJsonResponse,
  etagMatches,
  shouldSkipBodyRender,
  strongEtagFromBody,
  versionTokenFromValue,
  weakEtag,
} from '../src/httpConditional.js';

test('strong etag is stable for identical payloads', async () => {
  const a = await strongEtagFromBody({ rounds: [{ id: '1' }], count: 1 });
  const b = await strongEtagFromBody({ rounds: [{ id: '1' }], count: 1 });
  const c = await strongEtagFromBody({ rounds: [{ id: '2' }], count: 1 });
  assert.equal(a, b);
  assert.notEqual(a, c);
  assert.match(a, /^"[a-f0-9]{64}"$/);
});

test('weak etag encodes scope and version', () => {
  assert.equal(weakEtag('schedule:abc', 'deadbeef'), 'W/"schedule:abc:deadbeef"');
  assert.match(weakEtag('team-standings:x', '1'), /^W\//);
});

test('If-None-Match matching supports lists and weak tags', () => {
  const tag = 'W/"schedule:s1:abc"';
  assert.equal(etagMatches('W/"schedule:s1:abc"', tag), true);
  assert.equal(etagMatches('"schedule:s1:abc"', tag), true);
  assert.equal(etagMatches('W/"other"', tag), false);
  assert.equal(etagMatches('*', tag), true);
});

test('conditionalJsonFromVersion returns 304 without building body', async () => {
  let built = 0;
  const version = await versionTokenFromValue({ rounds: [{ id: '1', status: 'scheduled' }] });
  const scope = 'schedule:season-1';
  const etag = weakEtag(scope, version);

  const first = await conditionalJsonFromVersion(
    new Request('https://example.test/api/schedule'),
    {
      scope,
      version,
      buildBody: async () => {
        built += 1;
        return { rounds: [{ id: '1' }] };
      },
    },
  );
  assert.equal(first.status, 200);
  assert.equal(built, 1);
  assert.equal(first.headers.get('etag'), etag);

  const second = await conditionalJsonFromVersion(
    new Request('https://example.test/api/schedule', {
      headers: { 'if-none-match': etag },
    }),
    {
      scope,
      version,
      buildBody: async () => {
        built += 1;
        return { rounds: [{ id: '1' }] };
      },
    },
  );
  assert.equal(second.status, 304);
  assert.equal(built, 1, 'buildBody must not run on weak etag hit');
  assert.equal(shouldSkipBodyRender(second), true);
});

test('conditionalJsonResponse returns 304 when etag matches', async () => {
  const body = { standings: [{ team: 'A', wins: 1 }] };
  const first = await conditionalJsonResponse(new Request('https://example.test/api'), body);
  assert.equal(first.status, 200);
  const etag = first.headers.get('etag');
  const second = await conditionalJsonResponse(
    new Request('https://example.test/api', { headers: { 'if-none-match': etag } }),
    body,
  );
  assert.equal(second.status, 304);
});
