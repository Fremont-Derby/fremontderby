import test from 'node:test';
import assert from 'node:assert/strict';
import { renderPlayerSandboxPage } from '../src/playerSandboxPage.js';

test('player sandbox is isolated and exercises dual-score practice', () => {
  const html = renderPlayerSandboxPage();

  assert.match(html, /SANDBOX · PRACTICE ONLY/);
  assert.match(html, /Maya Example/);
  assert.match(html, /Eli Example/);
  assert.match(html, /Mismatch at rack/);
  assert.match(html, /Confirm my score/);
  assert.match(html, /Finalize practice match/);
  assert.match(html, /Reset sandbox/);
  assert.match(html, /fd\.playerSandbox\.v1/);
  assert.match(html, /fd\.accessToken/);
  assert.match(html, /function recordRack/);
  assert.match(html, /function createMatch/);

  assert.doesNotMatch(html, /\/api\/player-matches\//);
  assert.doesNotMatch(html, /supabase\.co/);
  assert.doesNotMatch(html, /SUPABASE_/);
});

test('player sandbox captures contextual feedback without competitive persistence', () => {
  const html = renderPlayerSandboxPage();

  assert.match(html, /Tell us what was confusing/);
  assert.match(html, /fd\.sandboxFeedback\.player\.v1/);
  assert.match(html, /surface:'player-sandbox'/);
  assert.match(html, /phase:state\.finalized\?'finalized'/);
  assert.match(html, /mismatchRack:bad/);
  assert.match(html, /racksA:history\('A'\)\.length/);
  assert.match(html, /Admin review submission is the next isolated persistence slice/);

  assert.doesNotMatch(html, /fetch\s*\(/);
  assert.doesNotMatch(html, /\/api\/sandbox-feedback/);
});
