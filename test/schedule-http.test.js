import test from 'node:test';
import assert from 'node:assert/strict';
import { handleListSeasonScheduleRequest } from '../src/index.js';
import { versionTokenFromValue, weakEtag } from '../src/httpConditional.js';

const env = {
  SUPABASE_URL: 'https://project.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-secret',
};

test('public schedule handler returns only human-readable schedule data', async () => {
  const responses = [
    [{ id: 'season-1' }],
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
  assert.equal(JSON.stringify(body).includes('team_a_id'), false);
});

test('public schedule handler returns 304 when weak version matches', async () => {
  const versionState = {
    rounds: [{ id: 'round-1', round_number: 1, scheduled_on: '2026-09-03', status: 'scheduled', stage: 'regular' }],
    matches: [{ id: 'match-1', round_id: 'round-1', status: 'scheduled', table_number: 1 }],
  };
  const version = await versionTokenFromValue(versionState);
  const etag = weakEtag('schedule:season-1', version);

  const responses = [
    [{ id: 'season-1' }],
    versionState.rounds,
    versionState.matches,
  ];
  const fetch = async () => new Response(JSON.stringify(responses.shift()), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
  const response = await handleListSeasonScheduleRequest(
    new Request('https://example.test/api/seasons/season-1/schedule', {
      headers: { 'if-none-match': etag },
    }),
    env,
    'season-1',
    { fetch },
  );
  assert.equal(response.status, 304);
  assert.equal(await response.text(), '');
});
