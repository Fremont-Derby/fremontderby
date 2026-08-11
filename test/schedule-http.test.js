import test from 'node:test';
import assert from 'node:assert/strict';
import { handleListSeasonScheduleRequest } from '../src/index.js';

const env = {
  SUPABASE_URL: 'https://project.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-secret',
};

test('public schedule handler returns only human-readable schedule data', async () => {
  const responses = [
    [{ id: 'round-1', round_number: 1, scheduled_on: '2026-09-03', status: 'scheduled', stage: 'regular' }],
    [{ id: 'match-1', round_id: 'round-1', team_a_id: 'team-1', team_b_id: 'team-2', table_number: 1, status: 'scheduled' }],
    [{ id: 'team-1', name: 'Breakers' }, { id: 'team-2', name: 'Rack Pack' }],
  ];
  const fetch = async () => new Response(JSON.stringify(responses.shift()), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });

  const response = await handleListSeasonScheduleRequest(
    env,
    'season-1',
    { fetch },
  );
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.rounds[0].matches[0].teamAName, 'Breakers');
  assert.equal(body.rounds[0].matches[0].teamBName, 'Rack Pack');
  assert.equal(JSON.stringify(body).includes('team_a_id'), false);
  assert.equal(JSON.stringify(body).includes('team_b_id'), false);
});
