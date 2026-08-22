import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';

import {
  jflModernStandingsStyles,
  renderIndividualStandingCard,
  renderJflModernStandings,
  renderTeamStandingCard,
  routeJflModernStandings,
} from '../src/jflModernStandings.js';
import { enhancePublicSeasonSelection } from '../src/publicSeasonSelectionEnhancer.js';

const teamRows = [
  {
    standings_rank: 1,
    team_name: 'JFL QA Breakers',
    games_played: 3,
    maximum_matches: 7,
    team_wins: 3,
    team_losses: 0,
    standing_points: 9,
    match_points: 7,
    match_points_against: 2,
    point_differential: 5,
    forfeits_won: 0,
    forfeits_lost: 0,
  },
  {
    standings_rank: 2,
    team_name: 'Cue Labs',
    games_played: 3,
    maximum_matches: 7,
    team_wins: 2,
    team_losses: 1,
    standing_points: 6,
    match_points: 5,
    match_points_against: 4,
    point_differential: 1,
    forfeits_won: 0,
    forfeits_lost: 0,
  },
];

const playerRows = [
  {
    standings_rank: 1,
    display_name: 'Alex Breaker',
    wins: 3,
    losses: 0,
    win_percentage: 1,
    games_won: 12,
    games_lost: 5,
    game_differential: 7,
    matches_played: 3,
    is_prize_eligible: true,
    prize_rank: 1,
    minimum_matches: 3,
  },
];

test('team card preserves authoritative row values and rank without recalculating or reordering', () => {
  const first = renderTeamStandingCard(teamRows[0], { tied: false });
  const second = renderTeamStandingCard(teamRows[1], { tied: false });

  assert.match(first, /data-standings-rank="1"/);
  assert.match(first, /JFL QA Breakers/);
  assert.match(first, />3-0</);
  assert.match(first, />9</);
  assert.match(first, />3 of 7 played</);
  assert.match(first, />7-2</);
  assert.match(first, />5</);
  assert.match(second, /data-standings-rank="2"/);
  assert.match(second, /Cue Labs/);
  assert.match(second, />2-1</);
  assert.match(second, />6</);
});

test('individual card preserves authoritative record, win rate, differential, and prize status', () => {
  const html = renderIndividualStandingCard(playerRows[0], { tied: false });
  assert.match(html, /data-standings-rank="1"/);
  assert.match(html, /Alex Breaker/);
  assert.match(html, />3-0</);
  assert.match(html, />100%</);
  assert.match(html, />12-5</);
  assert.match(html, />7</);
  assert.match(html, /Eligible #1/);
});

test('modern standings document uses the same authoritative read APIs and clear team/individual tabs', () => {
  const html = renderJflModernStandings();
  assert.match(html, /data-fd-modern-standings="true"/);
  assert.match(html, /\/api\/seasons/);
  assert.match(html, /team-standings/);
  assert.match(html, /individual-standings/);
  assert.match(html, /role="tablist"/);
  assert.match(html, /Team standings/);
  assert.match(html, /Individual standings/);
  assert.match(html, /data-fd-shell/);
  assert.match(html, /data-fd-mobile-dock/);
  assert.match(html, /\?ui=legacy/);
});

test('modern standings emits syntactically valid inline browser scripts', () => {
  const html = renderJflModernStandings();
  const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => match[1])
    .filter((script) => script.trim());

  assert.ok(scripts.length > 0);
  scripts.forEach((script, index) => {
    assert.doesNotThrow(() => new vm.Script(script, {
      filename: `jfl-modern-standings-inline-${index}.js`,
    }));
  });
});

test('modern standings survives shared public-season selection enhancement without legacy string rewrites', async () => {
  const original = routeJflModernStandings(
    new Request('https://jfl.fremontderby.com/standings'),
    { ENVIRONMENT: 'jfl' },
  );
  const enhanced = await enhancePublicSeasonSelection(original, '/standings');
  assert.equal(enhanced.status, 200);
  const html = await enhanced.text();
  assert.match(html, /data-fd-modern-standings="true"/);
  assert.match(html, /choosePublicSeason/);
});

test('JFL route is GET /standings only and preserves legacy/API/write behavior', async () => {
  const modern = routeJflModernStandings(
    new Request('https://jfl.fremontderby.com/standings'),
    { ENVIRONMENT: 'jfl' },
  );
  assert.ok(modern instanceof Response);
  assert.equal(modern.status, 200);
  assert.equal(modern.headers.get('x-fremont-ui-mode'), 'modern-standings-v1');
  assert.match(await modern.text(), /data-fd-modern-standings="true"/);

  assert.equal(routeJflModernStandings(new Request('https://jfl.fremontderby.com/standings?ui=legacy'), { ENVIRONMENT: 'jfl' }), null);
  assert.equal(routeJflModernStandings(new Request('https://jfl.fremontderby.com/standings'), { ENVIRONMENT: 'production' }), null);
  assert.equal(routeJflModernStandings(new Request('https://jfl.fremontderby.com/api/seasons/a/team-standings'), { ENVIRONMENT: 'jfl' }), null);
  assert.equal(routeJflModernStandings(new Request('https://jfl.fremontderby.com/standings', { method: 'POST' }), { ENVIRONMENT: 'jfl' }), null);
});

test('modern standings is mobile-first and keeps accessible touch/focus/high-contrast contracts', () => {
  assert.doesNotMatch(jflModernStandingsStyles, /overflow-x:\s*auto/i);
  assert.match(jflModernStandingsStyles, /min-height:\s*48px/);
  assert.match(jflModernStandingsStyles, /:focus-visible/);
  assert.match(jflModernStandingsStyles, /forced-colors:\s*active/);
  assert.match(jflModernStandingsStyles, /prefers-reduced-motion/);
  assert.match(jflModernStandingsStyles, /@media\s*\(max-width:\s*720px\)/);
});
