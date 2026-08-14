import assert from 'node:assert/strict';
import test from 'node:test';
import { shellStyles, decorateHtmlWithShell } from '../src/appShell.js';
import { renderAdminPlayersPage } from '../src/adminPlayersPage.js';
import { renderScorecardPage } from '../src/scorecardPage.js';

test('mobile Menu uses fixed panel and hides native details markers', () => {
  assert.match(shellStyles, /fd-nav-menu summary[\s\S]*appearance:\s*none/);
  assert.match(shellStyles, /fd-nav-menu summary::marker\s*\{\s*content:\s*''/);
  assert.match(shellStyles, /fd-nav--mobile[\s\S]*position:\s*fixed/);
  assert.match(shellStyles, /fd-nav--mobile[\s\S]*-webkit-overflow-scrolling:\s*touch/);
  assert.match(shellStyles, /min-height:\s*44px/);
});

test('shell injects nav menu close script for outside tap and Escape', () => {
  const html = decorateHtmlWithShell('<!doctype html><html><body><main>x</main></body></html>', '/teams');
  assert.match(html, /data-fd-nav-menu-script/);
  assert.match(html, /details\.fd-nav-menu/);
  assert.match(html, /menu\.open = false/);
  assert.match(html, /Escape/);
});

test('admin manage and scorecard details suppress iOS disclosure glitches', () => {
  const admin = renderAdminPlayersPage();
  assert.match(admin, /summary::marker\{content:''\}/);
  assert.match(admin, /appearance:none/);
  const score = renderScorecardPage();
  assert.match(score, /summary::marker\{content:''\}/);
});
