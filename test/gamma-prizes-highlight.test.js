import assert from 'node:assert/strict';
import test from 'node:test';
import { applyProductScriptRepairs } from '../src/productScriptRepairs.js';

test('prizes product repair injects ?team= highlight hook', async () => {
  const source = '<html><head></head><body><header></header><main></main></body></html>';
  const response = await applyProductScriptRepairs(
    new Response(source, { headers: { 'content-type': 'text/html' } }),
    '/prizes',
  );
  const html = await response.text();
  assert.match(html, /data-standings-highlight/);
  assert.match(html, /isRequestedStanding/);
  assert.match(html, /Showing team/);
});
