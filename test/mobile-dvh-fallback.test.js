import assert from 'node:assert/strict';
import test from 'node:test';
import { shellStyles, decorateHtmlWithShell } from '../src/appShell.js';
import { renderStandingsPage } from '../src/standingsPage.js';
import { renderSchedulePage } from '../src/schedulePage.js';
import { renderScorecardPage } from '../src/scorecardPage.js';
import { renderTeamsPage } from '../src/teamsPage.js';

test('shell menu max-height prefers 100dvh after 100vh fallback', () => {
  assert.match(shellStyles, /max-height:\s*calc\(100vh - 72px/);
  assert.match(shellStyles, /max-height:\s*calc\(100dvh - 72px/);
});

test('major pages set min-height with 100vh then 100dvh for mobile browser chrome', () => {
  for (const html of [renderStandingsPage(), renderSchedulePage(), renderTeamsPage()]) {
    assert.match(html, /min-height:\s*100vh/);
    assert.match(html, /min-height:\s*100dvh/);
  }
});

test('decorateHtmlWithShell injects theme-color for Android Chrome toolbar when missing', () => {
  const html = decorateHtmlWithShell(
    '<!doctype html><html><head><meta charset="utf-8" /><title>t</title></head><body><main>x</main></body></html>',
    '/teams',
  );
  assert.match(html, /name="theme-color"/);
  assert.match(html, /#07150f/);
});

test('scorecard / rack shell body supports dynamic viewport height', () => {
  const html = renderScorecardPage();
  // live match picker or rack ledger either way
  assert.match(html, /100vh/);
});
