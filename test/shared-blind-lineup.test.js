import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { renderCaptainSandboxPage } from '../src/captainSandboxPage.js';
import { renderLineupPage } from '../src/lineupPage.js';
import {
  sharedBlindLineupControllerSource,
  sharedBlindLineupMarkup,
} from '../src/blindLineupComponent.js';

test('production lineup and Captain War Games render the exact shared blind-lineup component/controller', () => {
  const live = renderLineupPage();
  const sandbox = renderCaptainSandboxPage();

  for (const html of [live, sandbox]) {
    assert.match(html, /data-shared-blind-lineup/);
    assert.ok(html.includes(sharedBlindLineupMarkup));
    assert.ok(html.includes(sharedBlindLineupControllerSource));
    assert.match(html, /Find a sub/);
    assert.match(html, /Paid \+ available substitutes/);
    assert.match(html, /Forfeit slot/);
    assert.match(html, /function renderMobileSummary\(\)/);
    assert.match(html, /function moveSlot\(from,to\)/);
    assert.match(html, /Lock this lineup\?/);
  }
});

test('live and sandbox pages are adapters instead of duplicate lineup controllers', async () => {
  const liveSource = await readFile(new URL('../src/lineupPage.js', import.meta.url), 'utf8');
  const sandboxSource = await readFile(new URL('../src/captainSandboxPage.js', import.meta.url), 'utf8');

  assert.match(liveSource, /sharedBlindLineupControllerSource/);
  assert.match(liveSource, /liveLineupAdapter/);
  assert.doesNotMatch(liveSource, /function renderSlots\(/);
  assert.doesNotMatch(liveSource, /function playerCard\(/);

  assert.match(sandboxSource, /sharedBlindLineupControllerSource/);
  assert.match(sandboxSource, /sandboxLineupAdapter/);
  assert.doesNotMatch(sandboxSource, /function slotHtml\(/);
  assert.doesNotMatch(sandboxSource, /function validation\(/);
  assert.doesNotMatch(sandboxSource, /fetch\s*\(/);
  assert.doesNotMatch(sandboxSource, /\/api\//);
  assert.doesNotMatch(sandboxSource, /fd\.accessToken/);
});

test('shared controller owns the blind-lineup integrity and mobile behavior', () => {
  const source = sharedBlindLineupControllerSource;
  assert.match(source, /selectedSlots=\[null,null,null\]/);
  assert.match(source, /new Set\(players\)\.size!==players\.length/);
  assert.match(source, /forfeitSlot/);
  assert.match(source, /lineupLocked=rows\.some/);
  assert.match(source, /opponentRows\.length>0/);
  assert.match(source, /mobileSubmitButton\.disabled=lineupLocked\|\|filled!==3/);
});
