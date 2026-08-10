import test from 'node:test';
import assert from 'node:assert/strict';
import { renderCaptainSandboxPage } from '../src/captainSandboxPage.js';

test('captain sandbox practices availability and three-player lineups without production writes', () => {
  const html = renderCaptainSandboxPage();

  assert.match(html, /SANDBOX · CAPTAIN PRACTICE ONLY/);
  assert.match(html, /Break Room Bandits/);
  assert.match(html, /Golden Rail/);
  assert.match(html, /Three active players/);
  assert.match(html, /free agent/i);
  assert.match(html, /Submit practice lineup/);
  assert.match(html, /Generated matchups/);
  assert.match(html, /Reset sandbox/);
  assert.match(html, /fd\.captainSandbox\.v1/);
  assert.match(html, /fd\.accessToken/);

  assert.doesNotMatch(html, /\/api\/teams\//);
  assert.doesNotMatch(html, /supabase\.co/);
  assert.doesNotMatch(html, /SUPABASE_/);
});
