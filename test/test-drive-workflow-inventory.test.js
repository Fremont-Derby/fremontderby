import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const captainSource = fs.readFileSync(new URL('../src/captainSandboxPage.js', import.meta.url), 'utf8');
const playerSource = fs.readFileSync(new URL('../src/playerSandboxPage.js', import.meta.url), 'utf8');
const inventory = fs.readFileSync(new URL('../docs/test-drive-workflow-inventory.md', import.meta.url), 'utf8');

test('Test Drive inventory classifies every current captain and player action', () => {
  assert.match(inventory, /\/demo.*Presentation-only orientation/);
  assert.match(inventory, /\/sandbox\/player.*Shared production component \+ sandbox adapter/);
  assert.match(inventory, /team-formation request approvals\/rejections.*Presentation-only orientation/);
  assert.match(inventory, /practice availability switches.*Presentation-only orientation/);
  assert.match(inventory, /roster\/substitute picker.*Shared production component \+ sandbox adapter/);
  assert.match(inventory, /midseason roster remove\/replacement exercise.*Presentation-only orientation/);
  assert.match(inventory, /feedback draft \/ clear.*Sandbox-only support behavior/);
  assert.match(inventory, /reset War Game.*Sandbox-only support behavior/);
});

test('Player War Games stays a thin adapter over the production rack-ledger component', () => {
  assert.match(playerSource, /renderRackLedgerScorecardPage/);
  assert.match(playerSource, /sandboxRackLedgerAdapterSource/);
  assert.doesNotMatch(playerSource, /fetch\(|\/api\/|SUPABASE|fd\.accessToken/);
});

test('Captain War Games shares production blind-lineup behavior but keeps orientation isolated', () => {
  assert.match(captainSource, /sharedBlindLineupMarkup/);
  assert.match(captainSource, /sharedBlindLineupControllerSource/);
  assert.match(captainSource, /FICTIONAL PRACTICE ONLY/);
  assert.match(captainSource, /Everything on this screen is fictional, throwaway practice stored only in this browser tab/);
  assert.doesNotMatch(captainSource, /fetch\(|\/api\/|SUPABASE|fd\.accessToken/);
});

test('inventory keeps QA evidence boundaries explicit', () => {
  assert.match(inventory, /implementation evidence only when the exercised behavior comes from the same production component\/controller\/domain module/);
  assert.match(inventory, /Fictional orientation may teach product concepts, but it is not proof/);
  assert.match(inventory, /Physical two-human and deployed-runtime proof remain separate/);
});
