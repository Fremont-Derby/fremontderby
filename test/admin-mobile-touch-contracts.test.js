import assert from 'node:assert/strict';
import test from 'node:test';
import { renderAdminPlayersPage } from '../src/adminPlayersPage.js';
import { renderAdminSeasonsPage } from '../src/adminSeasonsPage.js';
import { renderAdminSeasonTeamsPage } from '../src/adminSeasonTeamsPage.js';
import { renderAdminGatewayPage } from '../src/adminGatewayPage.js';

test('admin players search and letter chips meet mobile touch targets', () => {
  const html = renderAdminPlayersPage();
  assert.match(html, /name="viewport"/);
  assert.match(html, /min-height:\s*44px/);
  assert.match(html, /letter-index button\{[^}]*min-width:\s*44px/);
  assert.match(html, /letter-index button\{[^}]*min-height:\s*44px/);
  assert.match(html, /position:\s*sticky/);
  assert.match(html, /type="search"/);
  assert.match(html, /autocomplete="off"/);
});

test('admin seasons search, status filter, and letter chips stay phone-usable', () => {
  const html = renderAdminSeasonsPage();
  assert.match(html, /name="viewport"/);
  assert.match(html, /letter-index button\{[^}]*min-height:\s*44px/);
  assert.match(html, /position:\s*sticky/);
  assert.match(html, /data-status-filter/);
  assert.match(html, /type="search"/);
  assert.match(html, /Escape/);
});

test('admin season teams letter index uses touch-sized chips', () => {
  const html = renderAdminSeasonTeamsPage();
  assert.match(html, /name="viewport"/);
  assert.match(html, /letter-index button\{[^}]*min-width:\s*44px/);
  assert.match(html, /letter-index button\{[^}]*min-height:\s*44px/);
  assert.match(html, /position:\s*sticky/);
  assert.match(html, /data-letter-index/);
});

test('admin gateway cards keep large touch targets and focus rings', () => {
  const html = renderAdminGatewayPage();
  assert.match(html, /name="viewport"/);
  assert.match(html, /\.action\{[^}]*min-height:\s*48px/);
  assert.match(html, /:focus-visible/);
  assert.match(html, /Players/);
  assert.match(html, /Seasons/);
});
