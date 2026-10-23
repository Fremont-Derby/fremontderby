import assert from 'node:assert/strict';
import { test, expect } from '@playwright/test';
import { generateRoundRobin } from '../../domain/schedule.js';
import { seedSemifinals } from '../../domain/playoffs.js';
import { renderJflModernSchedule } from '../../src/jflModernSchedule.js';
import { renderJflModernStandings } from '../../src/jflModernStandings.js';
import { renderJflPublicPlayoffs } from '../../src/jflPublicPlayoffs.js';
import { enhancePublicSeasonSelection } from '../../src/publicSeasonSelectionEnhancer.js';

// #3562 Phase 1: full-season READ-MODEL + real browser rendering only.
// Never assert this is hosted season creation, real rack persistence, or live
// authorization. API interception is deliberate and isolated from backend data.
const sourceMode = process.env.PLAYWRIGHT_FULL_SEASON_SOURCE === '1';
const season = { id: 'synthetic-full-season-3562', name: 'Synthetic Complete Season', status: 'complete' };
const teams = Array.from({ length: 8 }, (_, index) => ({
  id: 'season-team-' + (index + 1),
  name: 'Season Test Team ' + (index + 1),
}));
const byId = new Map(teams.map(team => [team.id, team]));
const day = offset => new Date(Date.UTC(2026, 8, 3 + offset * 7)).toISOString().slice(0, 10);

function makeSeason() {
  const appearances = new Map(teams.map(team => [team.id, 0]));
  const records = new Map(teams.map(team => [team.id, { wins: 0, losses: 0, matchPoints: 0, against: 0 }]));
  const uniquePairs = new Set();
  const races = [];
  const rounds = generateRoundRobin(teams.map(team => team.id)).map((round, roundIndex) => ({
    roundId: 'week-' + round.round,
    roundNumber: round.round,
    stage: 'regular',
    scheduledOn: day(roundIndex),
    scheduledTime: '19:00',
    venueName: 'Synthetic QA Room',
    status: 'finalized',
    matches: round.matches.map(({ teamA, teamB }, tableIndex) => {
      const pair = [teamA, teamB].sort().join(':');
      assert.equal(uniquePairs.has(pair), false, 'Each team pairing is unique');
      uniquePairs.add(pair);
      appearances.set(teamA, appearances.get(teamA) + 1);
      appearances.set(teamB, appearances.get(teamB) + 1);
      // Deterministic results with an occasional upset, never a regular-season draw.
      const aSeed = Number(teamA.split('-').pop());
      const bSeed = Number(teamB.split('-').pop());
      const preferHigher = round.round === 3 && tableIndex % 2 === 0;
      const winner = preferHigher ? (aSeed > bSeed ? teamA : teamB) : (aSeed < bSeed ? teamA : teamB);
      const loser = winner === teamA ? teamB : teamA;
      records.get(winner).wins += 1;
      records.get(loser).losses += 1;
      records.get(winner).matchPoints += 2;
      records.get(winner).against += 1;
      records.get(loser).matchPoints += 1;
      records.get(loser).against += 2;
      const id = 'round-' + round.round + '-table-' + (tableIndex + 1);
      for (let slot = 1; slot <= 3; slot++) {
        races.push({ id: id + '-race-' + slot, round: round.round,
          teamA, teamB, winner: slot < 3 ? winner : loser });
      }
      return { teamMatchId: id, tableNumber: tableIndex + 1,
        teamAId: teamA, teamAName: byId.get(teamA).name,
        teamBId: teamB, teamBName: byId.get(teamB).name,
        status: 'finalized', teamAScore: teamA === winner ? 2 : 1,
        teamBScore: teamB === winner ? 2 : 1 };
    }),
  }));
  assert.equal(rounds.length, 7);
  assert.equal(uniquePairs.size, 28);
  assert.equal(races.length, 84);
  assert.ok([...appearances.values()].every(n => n === 7));
  assert.ok(rounds.every(round => round.matches.length === 4));
  assert.ok([...records.values()].every(r => r.wins + r.losses === 7));

  const ranked = [...teams].sort((left, right) => records.get(right.id).wins - records.get(left.id).wins
    || left.id.localeCompare(right.id));
  const standings = ranked.map((team, index) => {
    const row = records.get(team.id);
    return { team_id: team.id, team_name: team.name,
      standings_rank: index + 1, games_played: 7, maximum_matches: 7,
      team_wins: row.wins, team_losses: row.losses, standing_points: row.wins * 3,
      match_points: row.matchPoints, match_points_against: row.against,
      point_differential: row.matchPoints - row.against,
      forfeits_won: 0, forfeits_lost: 0 };
  });
  const individual = ranked.flatMap((team, index) => Array.from({ length: 3 }, (_, slot) => ({
    player_id: team.id + '-player-' + (slot + 1),
    display_name: team.name + ' Player ' + (slot + 1),
    standings_rank: index * 3 + slot + 1,
    wins: records.get(team.id).wins, losses: records.get(team.id).losses,
    matches_played: 7, win_percentage: records.get(team.id).wins / 7,
    games_won: records.get(team.id).wins * 5,
    games_lost: records.get(team.id).losses * 5,
    game_differential: (records.get(team.id).wins - records.get(team.id).losses) * 5,
    is_prize_eligible: true, prize_rank: index * 3 + slot + 1, minimum_matches: 5,
  })));
  const seeds = ranked.slice(0, 4).map(team => team.id);
  const semifinals = seedSemifinals(seeds);
  assert.equal(semifinals.length, 2);
  const semifinalMatches = semifinals.map((match, index) => {
    const a = byId.get(match.teamAId).name;
    const b = byId.get(match.teamBId).name;
    return { teamMatchId: 'semi-' + (index + 1),
      teamAName: a, teamBName: b, teamAId: match.teamAId, teamBId: match.teamBId,
      status: 'finalized', teamAScore: index === 0 ? 2 : 3,
      teamBScore: index === 0 ? 2 : 1,
      ...(index === 0 ? { anchorTiebreaker: {
        playerAName: a + ' Anchor', playerBName: b + ' Anchor',
        scoreA: 5, scoreB: 4, status: 'finalized',
      } } : {}) };
  });
  const champion = byId.get(semifinals[0].teamAId).name;
  const finalist = byId.get(semifinals[1].teamAId).name;
  const postseason = [
    { roundId: 'semifinals', stage: 'semifinal', scheduledOn: day(7), status: 'finalized',
      matches: semifinalMatches },
    { roundId: 'championship', stage: 'championship', scheduledOn: day(8), status: 'finalized',
      matches: [{ teamMatchId: 'championship', teamAName: champion,
        teamBName: finalist, teamAScore: 3, teamBScore: 1, status: 'finalized' }] },
  ];
  assert.notEqual(champion, finalist);
  return { rounds, postseason, standings, individual, races, champion };
}
const fixture = makeSeason();

test.beforeAll(async ({ request }) => {
  if (sourceMode) return;
  const expected = process.env.PLAYWRIGHT_EXPECTED_SHA;
  expect(expected, 'Deployed-page browser proof requires an exact JFL SHA').toMatch(/^[a-f0-9]{40}$/);
  const response = await request.get('/health/environment');
  expect(response.ok()).toBe(true);
  expect(await response.json()).toMatchObject({
    environment: 'jfl', expectedSupabaseSchema: 'jfl', ok: true, versionTag: expected,
  });
});

async function openSeasonBrowser(browser, mobile) {
  const origin = sourceMode ? 'https://full-season.test' :
    process.env.PLAYWRIGHT_BASE_URL || 'https://jfl.fremontderby.com';
  const context = await browser.newContext({
    baseURL: origin, viewport: mobile ? { width: 320, height: 844 } : { width: 1280, height: 900 },
    isMobile: mobile, hasTouch: mobile,
  });
  const requests = [];
  const unexpectedWrites = [];
  await context.route('**/api/**', async route => {
    const req = route.request();
    const path = new URL(req.url()).pathname;
    requests.push({ method: req.method(), path });
    const respond = (body, status = 200) => route.fulfill({
      status, contentType: 'application/json', body: JSON.stringify(body),
    });
    if (req.method() !== 'GET') {
      unexpectedWrites.push(path);
      return respond({ error: 'Synthetic season is strictly read-only' }, 405);
    }
    if (path === '/api/seasons') return respond({ seasons: [season] });
    if (path === '/api/seasons/' + season.id + '/schedule') {
      return respond({ rounds: [...fixture.rounds, ...fixture.postseason] });
    }
    if (path === '/api/seasons/' + season.id + '/team-standings') {
      return respond({ standings: fixture.standings });
    }
    if (path === '/api/seasons/' + season.id + '/individual-standings') {
      return respond({ standings: fixture.individual });
    }
    return respond({ error: 'No synthetic endpoint: ' + path }, 404);
  });
  await context.route('**/auth/**', route => route.fulfill({ status: 401, body: '{}' }));
  if (sourceMode) {
    const standingsHtml = await enhancePublicSeasonSelection(new Response(renderJflModernStandings(),
      { headers: { 'content-type': 'text/html' } }), '/standings');
    await context.route('**/schedule*', route => route.fulfill({
      contentType: 'text/html', body: renderJflModernSchedule(),
    }));
    await context.route('**/standings*', route => route.fulfill({
      contentType: 'text/html', body: standingsHtml,
    }));
    await context.route('**/playoffs*', route => route.fulfill({
      contentType: 'text/html', body: renderJflPublicPlayoffs(),
    }));
  }
  return { context, page: await context.newPage(), requests, unexpectedWrites };
}

for (const mobile of [false, true]) {
  test('all seven rounds, final standings, and champion stay visible through the supported UI ' +
    (mobile ? 'at 320px' : 'on desktop'), async ({ browser }) => {
    const run = await openSeasonBrowser(browser, mobile);
    const { page, context, requests, unexpectedWrites } = run;
    try {
      await page.goto('/schedule?season=' + season.id);
      await expect(page.locator('[data-schedule-status]')).toHaveText('Schedule ready');
      await expect(page.locator('[data-season-select]')).toHaveValue(season.id);
      await expect(page.locator('[data-schedule-rounds]')).toHaveCount(0); // No deprecated parallel rounds widget.
      await expect(page.locator('[data-schedule-groups] [data-round-id]')).toHaveCount(9);
      await expect(page.locator('[data-schedule-groups] [data-round-id^="week-"]')).toHaveCount(7);
      const regularCards = page.locator('[data-schedule-groups] [data-round-id^="week-"] .fd-schedule-match');
      await expect(regularCards).toHaveCount(28);
      await expect(regularCards.locator('.fd-schedule-match__score')).toHaveCount(28);
      await expect(page.locator('[data-round-select] option')).toHaveCount(9);
      for (let week = 1; week <= 7; week++) {
        const section = page.locator('[data-round-id="week-' + week + '"]');
        await expect(section.locator('.fd-schedule-match')).toHaveCount(4);
        await expect(section.locator('h2')).toHaveText('Week ' + week);
      }
      await page.locator('[data-round-select]').selectOption('week-4');
      await expect(page).toHaveURL(/round=week-4/);
      await page.reload();
      await expect(page.locator('[data-round-select]')).toHaveValue('week-4');
      await expect(regularCards).toHaveCount(28);

      await page.goto('/standings?season=' + season.id);
      await expect(page.locator('[data-standings-season]')).toHaveValue(season.id);
      await expect(page.locator('[data-standings-status]')).toHaveText('Standings loaded');
      const teamRows = page.locator('[data-team-standings-list] .fd-standing-row');
      await expect(teamRows).toHaveCount(8);
      const displayedNames = await teamRows.locator('.fd-standing-row__name').allTextContents();
      assert.deepEqual(displayedNames, fixture.standings.map(row => row.team_name));
      await expect(page.locator('[data-player-standings-list] .fd-standing-row')).toHaveCount(24);
      await page.reload();
      await expect(teamRows).toHaveCount(8);

      await page.goto('/playoffs?season=' + season.id);
      await expect(page.locator('[data-season]')).toHaveValue(season.id);
      await expect(page.locator('[data-status]')).toHaveText('2 postseason rounds');
      await expect(page.locator('[data-rounds] .fd-playoffs__round')).toHaveCount(2);
      await expect(page.locator('[data-rounds] .fd-playoffs__match')).toHaveCount(3);
      await expect(page.locator('[data-rounds]')).toContainText('Anchor tiebreaker');
      await expect(page.locator('[data-rounds]')).toContainText('Winner: ' + fixture.champion);
      await page.reload();
      await expect(page.locator('[data-rounds]')).toContainText('Winner: ' + fixture.champion);
      assert.deepEqual(unexpectedWrites, [], 'Synthetic browser suite must never write to JFL');
      assert.ok(requests.some(x => x.path.endsWith('/team-standings')));
      assert.ok(requests.some(x => x.path.endsWith('/individual-standings')));
      assert.ok(requests.some(x => x.path.endsWith('/schedule')));
      if (mobile) {
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      }
    } finally {
      await context.close();
    }
  });
}

test('full-season fixture has exactly 28 team matches, 84 race outcomes, four seeds and one champion', () => {
  const allMatches = fixture.rounds.flatMap(round => round.matches);
  assert.equal(allMatches.length, 28);
  assert.equal(fixture.races.length, 84);
  assert.equal(fixture.standings.length, 8);
  assert.equal(fixture.standings.reduce((count, row) => count + row.team_wins, 0), 28);
  assert.equal(fixture.standings.reduce((count, row) => count + row.team_losses, 0), 28);
  assert.equal(fixture.postseason[0].matches.length, 2);
  assert.equal(fixture.postseason[0].matches[0].teamAScore, 2);
  assert.equal(fixture.postseason[0].matches[0].teamBScore, 2);
  assert.equal(fixture.postseason[0].matches[0].anchorTiebreaker.status, 'finalized');
  assert.equal(fixture.postseason[1].matches.length, 1);
  assert.equal(fixture.postseason[1].matches[0].teamAName, fixture.champion);
});
