import test from 'node:test';
import assert from 'node:assert/strict';
import { renderIntroPage, renderRulesPage } from '../src/publicPages.js';
import { renderDemoSeasonPage } from '../src/demoSeasonPage.js';
import { renderCaptainSandboxPage } from '../src/captainSandboxPage.js';
import { renderPlayerSandboxPage } from '../src/playerSandboxPage.js';
import { renderJflNotFoundPage } from '../src/jflNotFoundPage.js';

const intro = renderIntroPage();
const rules = renderRulesPage();
const demo = renderDemoSeasonPage();
const captain = renderCaptainSandboxPage();
const player = renderPlayerSandboxPage();
const missing = renderJflNotFoundPage();

test('welcome page is titled Welcome', () => {
  assert.match(intro, /<title>Welcome · Fremont Derby/);
  assert.match(intro, /<h1[^>]*>Fremont Derby</);
});

test('welcome page says it is a cash league at one venue with four tables', () => {
  assert.match(intro, /Cash pool league/);
  assert.match(intro, /One venue/);
  assert.match(intro, /Four tables/);
  assert.match(intro, /Two ways to win/);
});

test('welcome page names the season shape', () => {
  assert.match(intro, /8 teams/);
  assert.match(intro, /12 weeks/);
  assert.match(intro, /seven-match single round robin/);
});

test('welcome page says teams put up three players and lock a four-player postseason roster', () => {
  assert.match(intro, /3 players/);
  assert.match(intro, /4-player postseason rosters/);
});

test('welcome page links to profile, demo, and rules', () => {
  assert.match(intro, /href="\/profile"/);
  assert.match(intro, /href="\/demo"/);
  assert.match(intro, /href="\/rules"/);
});

test('rules page is titled League Rules', () => {
  assert.match(rules, /<title>League Rules · Fremont Derby/);
  assert.match(rules, /League Rules/);
});

test('rules page says a team matchup has three individual matches', () => {
  assert.match(rules, /three individual player matches/);
});

test('rules page says captains submit the players used', () => {
  assert.match(rules, /Captains submit the players used for each matchup/);
});

test('rules page says there is no team-strength or Fargo cap', () => {
  assert.match(rules, /no team-strength or Fargo cap/);
});

test('rules page names the 8-ball and 9-ball format', () => {
  assert.match(rules, /8-ball \/ 9-ball format/);
});

test('demo page is titled Try a League Night', () => {
  assert.match(demo, /<title>Try a League Night · Fremont Derby/);
  assert.match(demo, /Try a League Night/);
});

test('demo page says the practice cannot affect the real season', () => {
  assert.match(demo, /CANNOT AFFECT THE REAL SEASON/);
  assert.match(demo, /FICTIONAL PLAYERS AND RESULTS/);
});

test('demo page offers a captain start and a jump to scoring', () => {
  assert.match(demo, /Start as captain/);
  assert.match(demo, /Jump to scoring/);
  assert.match(demo, /href="\/sandbox\/captain"/);
  assert.match(demo, /href="\/sandbox\/player"/);
});

test('demo page names the practice season shape', () => {
  assert.match(demo, /8 fictional teams/);
  assert.match(demo, /7 rounds/);
  assert.match(demo, /3 active players\/team/);
  assert.match(demo, /28 team matchups/);
  assert.match(demo, /8\/9 dual scoring/);
});

test('demo page offers a path to team standings and rules', () => {
  assert.match(demo, /Team standings/);
  assert.match(demo, /href="\/rules"/);
  assert.match(demo, /href="\/teams"/);
});

test('demo page names the practice teams', () => {
  assert.match(demo, /Break Room Bandits/);
  assert.match(demo, /Golden Rail/);
  assert.match(demo, /Nine Ball Neighbors/);
});

test('captain sandbox is titled as a war-games captain dry run', () => {
  assert.match(captain, /Captain · Fremont Derby/);
  assert.match(captain, /Captain dry run/);
});

test('captain sandbox says it never affects league records', () => {
  assert.match(captain, /NEVER AFFECTS LEAGUE RECORDS/);
  assert.match(captain, /No sign-in or setup required/);
});

test('captain sandbox walks form, availability, and lineup', () => {
  assert.match(captain, /Form Break Room Bandits/);
  assert.match(captain, /Round availability/);
  assert.match(captain, /Submit lineup/);
  assert.match(captain, /Pick your three/);
});

test('captain sandbox shows submitted and editable states', () => {
  assert.match(captain, /Not submitted · editable/);
  assert.match(captain, /Your selections can still be changed/);
  assert.match(captain, /Unlock lineup/);
});

test('captain sandbox offers a way to find a sub', () => {
  assert.match(captain, /Find a sub/);
  assert.match(captain, /Paid \+ available substitutes/);
});

test('captain sandbox links home and to the player sandbox', () => {
  assert.match(captain, /War Games home/);
  assert.match(captain, /href="\/demo"/);
  assert.match(captain, /href="\/sandbox\/player"/);
});

test('player sandbox is titled as a war-games score match', () => {
  assert.match(player, /Score Match · Fremont Derby/);
});

test('player sandbox marks the data as throwaway', () => {
  assert.match(player, /THROWAWAY DATA/);
});

test('player sandbox offers switch, retry, schedule, and score picker', () => {
  assert.match(player, /Switch match/);
  assert.match(player, /Try again/);
  assert.match(player, /View schedule/);
  assert.match(player, /Back to Score picker/);
});

test('missing page is a 404 with a way home', () => {
  assert.match(missing, /<title>404 · Fremont Derby/);
  assert.match(missing, /Page not found/);
  assert.match(missing, /Back home/);
  assert.match(missing, /href="\/"/);
});

test('missing page offers schedule and standings', () => {
  assert.match(missing, /href="\/schedule"/);
  assert.match(missing, /href="\/standings"/);
  assert.match(missing, /href="\/teams"/);
});
