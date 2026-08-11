import test from 'node:test';
import assert from 'node:assert/strict';
import { renderCaptainSandboxPage } from '../src/captainSandboxPage.js';

test('captain War Games starts ready and stays isolated from production', () => {
  const html = renderCaptainSandboxPage();

  assert.match(html, /SEASON 1 WAR GAMES/);
  assert.match(html, /No sign-in or setup required/);
  assert.match(html, /Break Room Bandits/);
  assert.match(html, /Golden Rail/);
  assert.match(html, /Maya Banks/);
  assert.match(html, /Theo Martin/);
  assert.match(html, /Jamie Park/);
  assert.match(html, /free agent/i);
  assert.match(html, /A valid starter lineup is already selected/);
  assert.match(html, /Submit lineup/);
  assert.match(html, /Score Match 1/);
  assert.match(html, /Tell us what was confusing/);
  assert.match(html, /fd\.captainSandbox\.v1/);
  assert.match(html, /fd\.sandboxFeedback\.captain\.v1/);
  assert.match(html, /surface:'captain-sandbox'/);
  assert.match(html, /availableCount/);
  assert.match(html, /ready-to-submit/);

  assert.doesNotMatch(html, /fd\.accessToken/);
  assert.doesNotMatch(html, /\/api\/teams\//);
  assert.doesNotMatch(html, /\/api\/sandbox-feedback/);
  assert.doesNotMatch(html, /supabase\.co/);
  assert.doesNotMatch(html, /SUPABASE_/);
});
