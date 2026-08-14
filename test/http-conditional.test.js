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
  assert.equal(a, b);
});

test('weak etag encodes scope and version', () => {
  assert.equal(weakEtag('schedule:abc', 'deadbeef'), 'W/"schedule:abc:deadbeef"');
});

test('If-None-Match matching supports lists and weak tags', () => {
  const tag = 'W/"schedule:s1:abc"';
  assert.equal(etagMatches('W/"schedule:s1:abc"', tag), true);
  assert.equal(etagMatches('*', tag), true);
});

test('cold path builds body once without requiring getVersion', async () => {
  let built = 0;
  let versioned = 0;
  const response = await conditionalJsonFromVersion(new Request('https://example.test/api/schedule'), {
    scope: 'schedule:season-1',
    getVersion: async () => {
      versioned += 1;
      return 'should-not-run-on-cold';
    },
    versionFromBody: async (body) => versionTokenFromValue(body),
    buildBody: async () => {
      built += 1;
      return { rounds: [{ id: '1' }] };
    },
  });
  assert.equal(response.status, 200);
  assert.equal(built, 1);
  assert.equal(versioned, 0, 'cold path must skip getVersion');
  assert.match(response.headers.get('etag'), /^W\//);
});

test('warm path 304 skips buildBody', async () => {
  let built = 0;
  const version = await versionTokenFromValue({ rounds: [{ id: '1', status: 'scheduled' }] });
  const scope = 'schedule:season-1';
  const etag = weakEtag(scope, version);
  const response = await conditionalJsonFromVersion(
    new Request('https://example.test/api/schedule', { headers: { 'if-none-match': etag } }),
    {
      scope,
      getVersion: async () => version,
      buildBody: async () => {
        built += 1;
        return { rounds: [{ id: '1' }] };
      },
    },
  );
  assert.equal(response.status, 304);
  assert.equal(built, 0);
  assert.equal(shouldSkipBodyRender(response), true);
});

test('conditionalJsonResponse returns 304 when etag matches', async () => {
  const body = { standings: [{ team: 'A', wins: 1 }] };
  const first = await conditionalJsonResponse(new Request('https://example.test/api'), body);
  const etag = first.headers.get('etag');
  const second = await conditionalJsonResponse(
    new Request('https://example.test/api', { headers: { 'if-none-match': etag } }),
    body,
  );
  assert.equal(second.status, 304);
});
