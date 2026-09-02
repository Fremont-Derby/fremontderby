import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../src/personaRouterEntry.js';

async function get(path) {
  return worker.fetch(
    new Request(`https://jfl.fremontderby.test${path}`),
    { ENVIRONMENT: 'jfl' },
  );
}

const CASES = [
  ['/inbox', /Messages · Fremont Derby/],
  ['/chat', /Messages · Fremont Derby/],
  ['/venues', /Rules|Fremont Derby/],
  ['/account', /Profile|Sign in|Fremont Derby/],
  ['/settings', /Profile|Sign in|Fremont Derby/],
  ['/me', /Profile|Sign in|Fremont Derby/],
  ['/scoring', /Score a Match|Scorecard|scorecard/i],
  ['/awards', /Prizes/i],
  ['/stats', /Standings/i],
  ['/tonight', /Schedule/i],
  ['/week', /Schedule/i],
  ['/directory', /Player directory · Fremont Derby/],
  ['/ready-check', /Check in/i],
  ['/lineups', /Lineup/i],
  ['/join', /Teams/i],
];

test('JFL leftover bookmarks rewrite onto live 200 pages', async () => {
  for (const [path, title] of CASES) {
    const response = await get(path);
    const html = await response.text();
    assert.equal(response.status, 200, `${path} status`);
    assert.match(response.headers.get('content-type') || '', /text\/html/, `${path} content-type`);
    assert.match(html, title, `${path} title`);
    assert.doesNotMatch(html, /This dog lost the rack/);
  }
});

test('JFL /inbox and /chat receive the bounded Messages layout', async () => {
  for (const path of ['/inbox', '/chat']) {
    const html = await (await get(path)).text();
    assert.match(html, /touch-action: pan-y/);
    assert.match(html, /height: min\(720px, calc\(100vh - 160px\)\)/);
  }
});
