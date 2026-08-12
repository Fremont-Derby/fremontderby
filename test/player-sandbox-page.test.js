import test from 'node:test';
import assert from 'node:assert/strict';
import { renderPlayerSandboxPage } from '../src/playerSandboxPage.js';


test('player War Games runs the shared production rack-ledger scorer against throwaway data', () => {
  const html = renderPlayerSandboxPage();

  assert.match(html, /data-shared-rack-ledger-scorecard/);
  assert.match(html, /data-primary-scoring/);
  assert.match(html, /SEASON 1 WAR GAMES/);
  assert.match(html, /THROWAWAY DATA/);
  assert.match(html, /production scoring interface against isolated practice data/);
  assert.match(html, /No sign-in or setup required/);
  assert.match(html, /Maya Banks/);
  assert.match(html, /Eli Torres/);
  assert.match(html, /Break Room Bandits/);
  assert.match(html, /Golden Rail/);
  assert.match(html, /Running team score/);
  assert.match(html, /Current individual race/);
  assert.match(html, /Rack ledger/);
  assert.match(html, /Mismatch at rack/);
  assert.match(html, /Confirm this side/);
  assert.match(html, /Finalize match/);
  assert.match(html, /Review the full Season 1 Test Drive/);
  assert.match(html, /fd\.playerSandbox\.v1/);
  assert.match(html, /fd\.sandboxFeedback\.player\.v1/);
});


test('War Games uses the same rack interactions as live scoring', () => {
  const html = renderPlayerSandboxPage();

  assert.match(html, />8 first</);
  assert.match(html, />9 first</);
  assert.match(html, /data-add-rack/);
  assert.match(html, /data-edit-rack/);
  assert.match(html, /data-edit-result="W"/);
  assert.match(html, /data-edit-result="L"/);
  assert.match(html, /const nextRack=own\.length\+1/);
  assert.match(html, /state==='matched'\?'✓':state==='mismatch'\?'⚠':state==='pending'\?'…':'—'/);
  assert.match(html, /Later racks stay exactly as entered/);
  assert.match(html, /Racks 1–3 use this game/);
});


test('War Games adapter stays isolated from production auth, APIs, and Supabase', () => {
  const html = renderPlayerSandboxPage();

  assert.doesNotMatch(html, /fd\.accessToken/);
  assert.doesNotMatch(html, /\/api\/player-matches\//);
  assert.doesNotMatch(html, /supabase\.co/);
  assert.doesNotMatch(html, /SUPABASE_/);
  assert.doesNotMatch(html, /authorization:'Bearer/);
});
