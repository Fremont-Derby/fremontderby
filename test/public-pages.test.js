import test from 'node:test';
import assert from 'node:assert/strict';
import { renderIntroPage, renderRulesPage } from '../src/publicPages.js';

test('intro page links to the league rules and standings', () => {
  const html = renderIntroPage();
  assert.match(html, /Fremont Derby/);
  assert.match(html, /Read the rules/);
  assert.match(html, /href="\/rules"/);
  assert.match(html, /href="\/standings"/);
});

test('rulebook states flexible scheduling and team-owned dual score confirmation', () => {
  const html = renderRulesPage();
  assert.match(html, /play early, late, out of round order/);
  assert.match(html, /Each team maintains its own rack-by-rack score record/);
  assert.match(html, /two team-owned rack records must agree/i);
  assert.match(html, /There is no team-strength or Fargo cap/);
});

test('rulebook allows multi-team nights while enforcing Season 1 match limits', () => {
  const html = renderRulesPage();
  assert.match(html, /three individual player matches/);
  assert.match(html, /different teams on the same league night/);
  assert.match(html, /no more than seven regular-season individual matches total/);
  assert.match(html, /may not shoot twice for the same team in the same team matchup/);
  assert.doesNotMatch(html, /cannot play for two teams in the same scheduled round/);
});

test('homepage explains the 12-week season window and built-in makeup time', () => {
  const html = renderIntroPage();
  assert.match(html, /season spans 12 calendar weeks/i);
  assert.match(html, /seven scheduled rounds plus built-in off and makeup weeks/i);
  assert.match(html, /holidays, conflicts, and rescheduling/i);
});
