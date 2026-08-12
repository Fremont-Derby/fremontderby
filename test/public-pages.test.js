import test from 'node:test';
import assert from 'node:assert/strict';
import { renderIntroPage, renderRulesPage } from '../src/publicPages.js';

test('intro page makes the cash league format obvious and stays concise', () => {
  const html = renderIntroPage();
  assert.match(html, /Cash pool league\. One venue\. Four tables\. Two ways to win\./);
  assert.match(html, /8 teams · 12 weeks/);
  assert.match(html, /3 players/);
  assert.match(html, /4-player postseason rosters/);
  assert.match(html, /individual cash competition/);
  assert.match(html, /Free agents and subs can still play/);
  assert.match(html, /href="\/profile"/);
  assert.match(html, /Join \/ sign in/);
  assert.doesNotMatch(html, /<h2>How it works<\/h2>/);
});

test('intro page links to deeper league details', () => {
  const html = renderIntroPage();
  assert.match(html, /href="\/demo"/);
  assert.match(html, /href="\/rules"/);
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
