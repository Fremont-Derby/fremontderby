import test from 'node:test';
import assert from 'node:assert/strict';
import { handleListSeasonScheduleRequest } from '../src/index.js';

const env = {
  SUPABASE_URL: 'https://project.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-secret',
};

test('public schedule handler returns only human-readable schedule data', async () => {
  const responses = [
    [{ id: 'season-1', name: 'Season 1', status: 'active' }],
    // version fingerprint
    [{ id: 'round-1', round_number: 1, scheduled_on: '2026-09-03', status: 'scheduled', stage: 'regular' }],
    [{ id: 'match-1', round_id: 'round-1', status: 'scheduled', table_number: 1, team_a_id: 'team-1', team_b_id: 'team-2' }],
    // full schedule
    [{ id: 'round-1', round_number: 1, scheduled_on: '2026-09-03', status: 'scheduled', stage: 'regular' }],
    [{ id: 'match-1', round_id: 'round-1', team_a_id: 'team-1', team_b_id: 'team-2', table_number: 1, status: 'scheduled' }],
    [{ id: 'team-1', name: 'Breakers' }, { id: 'team-2', name: 'Rack Pack' }],
  ];
  const fetch = async () => new Response(JSON.stringify(responses.shift()), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });

  const response = await handleListSeasonScheduleRequest(
    new Request('https://example.test/api/seasons/season-1/schedule'),
    env,
    'season-1',
    { fetch },
  );
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.ok(response.headers.get('etag')?.startsWith('W/'));
  assert.equal(body.rounds[0].matches[0].teamAName, 'Breakers');
  assert.equal(body.rounds[0].matches[0].teamBName, 'Rack Pack');
  assert.equal(JSON.stringify(body).includes('team_a_id'), false);
  assert.equal(JSON.stringify(body).includes('team_b_id'), false);
});

test('public schedule handler returns 304 when weak version matches', async () => {
  const versionRounds = [{ id: 'round-1', round_number: 1, scheduled_on: '2026-09-03', status: 'scheduled', stage: 'regular' }];
  const versionMatches = [{ id: 'match-1', round_id: 'round-1', status: 'scheduled', table_number: 1, team_a_id: 'team-1', team_b_id: 'team-2' }];
  const responses = [
    [{ id: 'season-1', name: 'Season 1', status: 'active' }],
    versionRounds,
    versionMatches,
  ];
  const fetch = async () => new Response(JSON.stringify(responses.shift()), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });

  // First get etag
  const firstResponses = [
    [{ id: 'season-1', name: 'Season 1', status: 'active' }],
    versionRounds,
    versionMatches,
    versionRounds,
    versionMatches,
    [{ id: 'team-1', name: 'Breakers' }, { id: 'team-2', name: 'Rack Pack' }],
  ];
  let i = 0;
  const fetch1 = async () => new Response(JSON.stringify(firstResponses[i++]), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
  const first = await handleListSeasonScheduleRequest(
    new Request('https://example.test/api/seasons/season-1/schedule'),
    env,
    'season-1',
    { fetch: fetch1 },
  );
  assert.equal(first.status, 200);
  const etag = first.headers.get('etag');

  let j = 0;
  const secondResponses = [
    [{ id: 'season-1', name: 'Season 1', status: 'active' }],
    versionRounds,
    versionMatches,
  ];
  const fetch2 = async () => new Response(JSON.stringify(secondResponses[j++]), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
  const second = await handleListSeasonScheduleRequest(
    new Request('https://example.test/api/seasons/season-1/schedule', {
      headers: { 'if-none-match': etag },
    }),
    env,
    'season-1',
    { fetch: fetch2 },
  );
  assert.equal(second.status, 304);
  assert.equal(await second.text(), '');
});
