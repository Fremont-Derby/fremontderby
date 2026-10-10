import test from 'node:test';
import assert from 'node:assert/strict';
import { renderStandingsPage } from '../src/standingsPage.js';
import { renderTeamsPage } from '../src/teamsPage.js';
import { renderTradesPage } from '../src/tradesPage.js';
import { renderPrizesPage } from '../src/prizesPage.js';

const standings = renderStandingsPage();
const teams = renderTeamsPage();
const trades = renderTradesPage();
const prizes = renderPrizesPage();

test('standings page is titled for the league', () => {
  assert.match(standings, /<title>Fremont Derby Standings/);
});

test('standings page offers team and individual views', () => {
  assert.match(standings, /Team standings/);
  assert.match(standings, /Individual standings/);
});

test('standings page offers load and reload', () => {
  assert.match(standings, /Load standings/);
  assert.match(standings, /Reload standings/);
});

test('standings page shows season loading', () => {
  assert.match(standings, /Loading seasons/);
});

test('standings page shows registered teams, rostered players, and open slots', () => {
  assert.match(standings, /Teams registered/);
  assert.match(standings, /Rostered players/);
  assert.match(standings, /Open team slots/);
});

test('standings page offers a way to register or join a team', () => {
  assert.match(standings, /Register or join a team/);
  assert.match(standings, /href="\/teams"/);
});

test('teams page is titled for the league', () => {
  assert.match(teams, /<title>Fremont Derby Teams/);
});

test('teams page shows a loading state while access is checked', () => {
  assert.match(teams, /Checking your teams/);
  assert.match(teams, /Loading your teams/);
  assert.match(teams, /Checking your sign-in and team access/);
});

test('teams page shows the next matchup', () => {
  assert.match(teams, /Next matchup/);
  assert.match(teams, /Finding your matchup/);
});

test('teams page links to lineup, check-in, score, messages, and trades', () => {
  assert.match(teams, /href="\/lineup"/);
  assert.match(teams, /href="\/availability"/);
  assert.match(teams, /href="\/scorecard"/);
  assert.match(teams, /href="\/messages"/);
  assert.match(teams, /href="\/trades"/);
});

test('teams page tells the player to build a lineup', () => {
  assert.match(teams, /Build lineup/);
});

test('teams page tells the player to tell captains whether they can play', () => {
  assert.match(teams, /Tell captains whether you can play/);
});

test('teams page offers a way to score a match', () => {
  assert.match(teams, /Score a match/);
  assert.match(teams, /keep both scores together/);
});

test('teams page offers a way to message the team or the opponent', () => {
  assert.match(teams, /Message your team or tonight/);
});

test('teams page offers team management for invites and moves', () => {
  assert.match(teams, /Team management/);
  assert.match(teams, /Handle invites, requests, and player moves/);
  assert.match(teams, /Manage team/);
});

test('teams page offers a way to apply for a team slot', () => {
  assert.match(teams, /Apply for team slot/);
  assert.match(teams, /My team applications/);
});

test('trades page is titled for the league', () => {
  assert.match(trades, /<title>Fremont Derby Trades/);
});

test('trades page asks for both teams and both players', () => {
  assert.match(trades, /My team ID/);
  assert.match(trades, /My player ID/);
  assert.match(trades, /Other team ID/);
  assert.match(trades, /Other player ID/);
});

test('trades page offers propose and refresh', () => {
  assert.match(trades, /Propose trade/);
  assert.match(trades, /Refresh/);
});

test('trades page names the player and captain steps', () => {
  assert.match(trades, /Player acceptance/);
  assert.match(trades, /Captain approval/);
});

test('trades page says when no trades are loaded', () => {
  assert.match(trades, /No trades loaded/);
});

test('prizes page is titled for the league', () => {
  assert.match(prizes, /<title>Fremont Derby Prizes/);
});

test('prizes page offers a way to load prizes for a season', () => {
  assert.match(prizes, /Load prizes/);
  assert.match(prizes, /Loading seasons/);
});

test('prizes page links to the league rules', () => {
  assert.match(prizes, /View league rules/);
  assert.match(prizes, /href="\/rules"/);
});

test('prizes page says when no projected or finalized payouts are loaded', () => {
  assert.match(prizes, /No projected payouts loaded/);
  assert.match(prizes, /No finalized payouts loaded/);
  assert.match(prizes, /Finalized payouts/);
});
