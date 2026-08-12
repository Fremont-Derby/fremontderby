import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { renderPlayerSandboxPage } from '../src/playerSandboxPage.js';
import { renderScorecardPage } from '../src/scorecardPage.js';
import {
  sharedRackLedgerScorecardControllerSource,
  sharedRackLedgerScorecardMarkup,
} from '../src/rackLedgerScorecard.js';


test('live scoring and War Games render the exact shared rack-ledger component/controller', () => {
  const live = renderScorecardPage();
  const sandbox = renderPlayerSandboxPage();

  for (const html of [live, sandbox]) {
    assert.match(html, /data-shared-rack-ledger-scorecard/);
    assert.ok(html.includes(sharedRackLedgerScorecardMarkup));
    assert.ok(html.includes(sharedRackLedgerScorecardControllerSource));
  }
});


test('live and sandbox page modules are thin wrappers around the shared scorer', async () => {
  const liveSource = await readFile(new URL('../src/scorecardPage.js', import.meta.url), 'utf8');
  const sandboxSource = await readFile(new URL('../src/playerSandboxPage.js', import.meta.url), 'utf8');

  assert.match(liveSource, /renderRackLedgerScorecardPage/);
  assert.match(liveSource, /liveRackLedgerAdapterSource/);
  assert.doesNotMatch(liveSource, /function rackState/);
  assert.doesNotMatch(liveSource, /function renderLedger/);

  assert.match(sandboxSource, /renderRackLedgerScorecardPage/);
  assert.match(sandboxSource, /sandboxRackLedgerAdapterSource/);
  assert.doesNotMatch(sandboxSource, /function rackState/);
  assert.doesNotMatch(sandboxSource, /function renderLedger/);
});


test('shared scorer owns the QA-critical scoring behavior', () => {
  const source = sharedRackLedgerScorecardControllerSource;
  assert.match(source, /function rackState/);
  assert.match(source, /function renderLedger/);
  assert.match(source, /const nextRack=own\.length\+1/);
  assert.match(source, /const canAnswerPending=editable&&!rack&&state==='pending'/);
  assert.match(source, /const answeringPending=!ownRack&&Boolean\(opponentRack\)&&number===own\.length\+1/);
  assert.match(source, /Score changed on another phone\. We refreshed it—check the current rack before scoring\./);
  assert.match(source, /setInterval\(\(\)=>/);
});
