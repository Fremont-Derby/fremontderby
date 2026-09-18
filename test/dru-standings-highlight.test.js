import assert from 'node:assert/strict';
import test from 'node:test';
import { enhancePublicSeasonSelection } from '../src/publicSeasonSelectionEnhancer.js';

const source = '<html><head></head><body><header></header><main></main></body></html>';

async function enhance(pathname) {
  return enhancePublicSeasonSelection(
    new Response(source, { headers: { 'content-type': 'text/html' } }),
    pathname,
  );
}

test('DRU standings enhancer injects ?team= highlight hook', async () => {
  const html = await (await enhance('/standings')).text();
  assert.match(html, /data-standings-highlight/);
  assert.match(html, /isRequestedStanding/);
  assert.match(html, /Showing team/);
});

test('DRU prizes enhancer injects ?team= highlight hook', async () => {
  const html = await (await enhance('/prizes')).text();
  assert.match(html, /data-standings-highlight/);
  assert.match(html, /isRequestedStanding/);
});
