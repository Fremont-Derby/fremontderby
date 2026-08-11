import test from 'node:test';
import assert from 'node:assert/strict';
import { renderPlayerSandboxPage } from '../src/playerSandboxPage.js';

test('player War Games supports fast dual-score practice without production writes', () => {
  const html = renderPlayerSandboxPage();

  assert.match(html, /SEASON 1 WAR GAMES/);
  assert.match(html, /No sign-in or setup required/);
  assert.match(html, /Maya Banks/);
  assert.match(html, /Eli Torres/);
  assert.match(html, /Mismatch at rack/);
  assert.match(html, /Load completed matching score/);
  assert.match(html, /Confirm this side/);
  assert.match(html, /Finalize practice match/);
  assert.match(html, /Review the full Season 1/);
  assert.match(html, /fd\.playerSandbox\.v1/);
  assert.match(html, /function recordRack/);
  assert.match(html, /function createMatch/);

  assert.doesNotMatch(html, /fd\.accessToken/);
  assert.doesNotMatch(html, /\/api\/player-matches\//);
  assert.doesNotMatch(html, /supabase\.co/);
  assert.doesNotMatch(html, /SUPABASE_/);
});
