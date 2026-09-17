import assert from 'node:assert/strict';
import test from 'node:test';
import { applyProductScriptRepairs } from '../src/productScriptRepairs.js';

async function repair(path, source) {
  const response = await applyProductScriptRepairs(
    new Response(source, { headers: { 'content-type': 'text/html' } }),
    path,
  );
  return response.text();
}

for (const path of ['/availability', '/lineup', '/scorecard', '/profile', '/teams', '/playoffs', '/schedule', '/messages', '/notifications', '/practice', '/players', '/free-agents']) {
  test(`gamma ${path} product repair injects next match`, async () => {
    const html = await repair(path, '<html><head></head><body><header></header><main></main></body></html>');
    assert.match(html, /data-next-match/);
    assert.match(html, /\/api\/me\/matches/);
    assert.match(html, /pickNextMatch/);
  });
}

test('gamma players product repair injects ?player= highlight', async () => {
  const html = await repair('/players', '<html><head></head><body><header></header><input type="search" name="q"></body></html>');
  assert.match(html, /data-player-highlight/);
  assert.match(html, /Showing player/);
});

test('gamma product repair rewrites leftover trades nav to teams', async () => {
  const html = await repair('/playoffs', '<html><head></head><body><header></header><a href="/trades">Trades</a></body></html>');
  assert.match(html, /href="\/teams"/);
  assert.doesNotMatch(html, /href="\/trades"/);
});

test('gamma free-agents product repair injects invitations read', async () => {
  const html = await repair('/free-agents', '<html><head></head><body><header></header><main><p>Shell copy</p></main></body></html>');
  assert.match(html, /data-invites/);
  assert.match(html, /data-invite-status/);
  assert.match(html, /\/api\/me\/invitations/);
  assert.match(html, /team invite/);
});
