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
  assert.match(html, /Tell us what was confusing/);
  assert.match(html, /fd\.playerSandbox\.v1/);
  assert.match(html, /fd\.sandboxFeedback\.player\.v1/);
  assert.match(html, /surface:'player-sandbox'/);
  assert.match(html, /mismatchRack/);
  assert.match(html, /confirmedA/);
  assert.match(html, /function recordRack/);
  assert.match(html, /function createMatch/);

  assert.doesNotMatch(html, /fd\.accessToken/);
  assert.doesNotMatch(html, /\/api\/player-matches\//);
  assert.doesNotMatch(html, /\/api\/sandbox-feedback/);
  assert.doesNotMatch(html, /supabase\.co/);
  assert.doesNotMatch(html, /SUPABASE_/);
});

test('player War Games previews the compact side-by-side race used by live scoring', () => {
  const html = renderPlayerSandboxPage();

  assert.match(html, /data-primary-scoring/);
  assert.match(html, /data-discipline>8-BALL/);
  assert.match(html, /data-rack-number/);
  assert.match(html, /data-markers-a/);
  assert.match(html, /data-markers-b/);
  assert.match(html, /Maya wins rack 1/);
  assert.match(html, /Eli wins rack 1/);
  assert.match(html, /grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)/);
  assert.doesNotMatch(html, /\.score-grid\s*\{[^}]*grid-template-columns:1fr/s);
});
