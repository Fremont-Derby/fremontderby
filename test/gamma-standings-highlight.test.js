import assert from 'node:assert/strict';
import test from 'node:test';
import { isRequestedStanding } from '../src/standingsHighlight.js';
import { applyProductScriptRepairs } from '../src/productScriptRepairs.js';

test('requested standing names match case-insensitively', () => {
  assert.equal(isRequestedStanding('Rail Owls', 'rail owls'), true);
  assert.equal(isRequestedStanding('Rail Owls', 'Green Felt'), false);
});

test('standings product repair injects ?team= highlight hook', async () => {
  const source = '<html><head></head><body><header></header><main></main></body></html>';
  const response = await applyProductScriptRepairs(
    new Response(source, { headers: { 'content-type': 'text/html' } }),
    '/standings',
  );
  const html = await response.text();
  assert.match(html, /data-standings-highlight/);
  assert.match(html, /isRequestedStanding/);
  assert.match(html, /Showing standing/);
});
