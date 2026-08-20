import test from 'node:test';
import assert from 'node:assert/strict';

import {
  jflModernScheduleStyles,
  normalizeScheduleRounds,
  renderScheduleMatchCard,
  renderJflModernSchedule,
  routeJflModernSchedule,
} from '../src/jflModernSchedule.js';
import { enhancePublicSeasonSelection } from '../src/publicSeasonSelectionEnhancer.js';

const sampleRounds = [
  {
    roundId: 'round-2',
    roundNumber: 2,
    scheduledOn: '2026-09-10',
    scheduledTime: '19:00',
    venueName: '4B’s Tavern',
    matches: [
      {
        teamMatchId: 'match-2',
        tableNumber: 2,
        teamAId: 'team-c',
        teamAName: 'Cue Crew',
        teamBId: 'team-d',
        teamBName: 'Rail Riders',
        status: 'finalized',
        teamAScore: 2,
        teamBScore: 1,
      },
    ],
  },
  {
    roundId: 'round-1',
    roundNumber: 1,
    scheduledOn: '2026-09-03',
    matches: [
      {
        teamMatchId: 'match-1b',
        tableNumber: 3,
        teamAId: 'team-b',
        teamAName: 'Bank Shots',
        teamBId: 'team-a',
        teamBName: 'JFL QA Breakers',
        status: 'scheduled',
      },
      {
        teamMatchId: 'match-1a',
        tableNumber: 1,
        teamAId: 'team-x',
        teamAName: 'Side Pockets',
        teamBId: 'team-y',
        teamBName: 'Nine Lives',
        status: 'scheduled',
      },
    ],
  },
];

test('normalizes rounds into deterministic date/round/table order without changing source objects', () => {
  const original = structuredClone(sampleRounds);
  const normalized = normalizeScheduleRounds(sampleRounds);
  assert.deepEqual(sampleRounds, original);
  assert.equal(normalized[0].roundId, 'round-1');
  assert.deepEqual(normalized[0].matches.map((match) => match.tableNumber), [1, 3]);
  assert.equal(normalized[1].roundId, 'round-2');
});

test('compact match cards expose opponent, status, time, venue/table, semantic my-team emphasis, and accessible details', () => {
  const html = renderScheduleMatchCard(sampleRounds[0].matches[0], {
    round: sampleRounds[0],
    myTeamIds: ['team-c'],
  });
  assert.match(html, /data-my-match="true"/);
  assert.match(html, />Your match</);
  assert.match(html, /Cue Crew/);
  assert.match(html, /Rail Riders/);
  assert.match(html, /2\s*[-–]\s*1/);
  assert.match(html, /7:00 PM/);
  assert.match(html, /4B’s Tavern/);
  assert.match(html, /Table 2/);
  assert.match(html, /<details/);
  assert.match(html, /<summary[^>]*>Details/);
  assert.match(html, /\/scorecard\?match=match-2/);
  assert.match(html, /\/messages\?matchup=match-2/);
});

test('missing time and venue are explicit rather than invented', () => {
  const html = renderScheduleMatchCard(sampleRounds[1].matches[0], { round: sampleRounds[1] });
  assert.match(html, /Time TBD/);
  assert.match(html, /Venue TBD/);
});

test('modern schedule document keeps the existing read APIs and shared shell', () => {
  const html = renderJflModernSchedule();
  assert.match(html, /data-fd-modern-schedule="true"/);
  assert.match(html, /\/api\/seasons/);
  assert.match(html, /\/api\/seasons\/[^'"`]*schedule/);
  assert.match(html, /data-fd-shell/);
  assert.match(html, /data-fd-mobile-dock/);
  assert.match(html, /\?ui=legacy/);
});

test('modern schedule survives shared public-season selection enhancement', async () => {
  const original = routeJflModernSchedule(
    new Request('https://jfl.fremontderby.com/schedule'),
    { ENVIRONMENT: 'jfl' },
  );
  const enhanced = await enhancePublicSeasonSelection(original, '/schedule');
  assert.equal(enhanced.status, 200);
  const html = await enhanced.text();
  assert.match(html, /data-fd-modern-schedule="true"/);
  assert.match(html, /data-fd-mobile-dock/);
});

test('route is JFL GET /schedule only and leaves legacy/API/write behavior untouched', async () => {
  const modern = routeJflModernSchedule(
    new Request('https://jfl.fremontderby.com/schedule'),
    { ENVIRONMENT: 'jfl' },
  );
  assert.ok(modern instanceof Response);
  assert.equal(modern.status, 200);
  assert.equal(modern.headers.get('x-fremont-ui-mode'), 'modern-schedule-v1');
  assert.match(await modern.text(), /data-fd-modern-schedule="true"/);

  assert.equal(routeJflModernSchedule(new Request('https://jfl.fremontderby.com/schedule?ui=legacy'), { ENVIRONMENT: 'jfl' }), null);
  assert.equal(routeJflModernSchedule(new Request('https://jfl.fremontderby.com/schedule'), { ENVIRONMENT: 'production' }), null);
  assert.equal(routeJflModernSchedule(new Request('https://jfl.fremontderby.com/api/seasons/abc/schedule'), { ENVIRONMENT: 'jfl' }), null);
  assert.equal(routeJflModernSchedule(new Request('https://jfl.fremontderby.com/schedule', { method: 'POST' }), { ENVIRONMENT: 'jfl' }), null);
});

test('modern schedule keeps touch, focus, reduced-motion, and forced-colors contracts', () => {
  assert.match(jflModernScheduleStyles, /min-height:\s*44px/);
  assert.match(jflModernScheduleStyles, /:focus-visible/);
  assert.match(jflModernScheduleStyles, /prefers-reduced-motion/);
  assert.match(jflModernScheduleStyles, /forced-colors:\s*active/);
});
