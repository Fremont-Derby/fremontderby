import assert from 'node:assert/strict';
import test from 'node:test';
import { createStandingsRepository } from '../src/standingsRepository.js';

function mockFetch(routes) {
  return async (url) => {
    const href = String(url);
    for (const [needle, payload] of routes) {
      if (href.includes(needle)) {
        return new Response(JSON.stringify(payload), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
    }
    return new Response(JSON.stringify({ message: 'not mocked ' + href }), { status: 500 });
  };
}

test('schedule version token uses lightweight match state', async () => {
  const fetchImpl = mockFetch([
    ['/rounds?', [{ id: 'r1', round_number: 1, scheduled_on: '2026-09-01', status: 'scheduled', stage: 'regular' }]],
    ['/team_matches?', [{ id: 'm1', round_id: 'r1', status: 'scheduled', table_number: 1, team_a_id: 'a', team_b_id: 'b' }]],
  ]);
  const repo = createStandingsRepository(
    { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'service' },
    { fetch: fetchImpl },
  );
  const version = await repo.getSeasonScheduleVersion({ seasonId: '11111111-1111-1111-1111-111111111111' });
  assert.equal(version.rounds[0].status, 'scheduled');
  assert.equal(version.matches[0].id, 'm1');
});

test('standings version token tracks match status rollup', async () => {
  const fetchImpl = mockFetch([
    ['/team_matches?', [{ id: 'm1', status: 'finalized' }]],
    ['/rounds?', [{ id: 'r1', status: 'finalized' }]],
  ]);
  const repo = createStandingsRepository(
    { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'service' },
    { fetch: fetchImpl },
  );
  const version = await repo.getSeasonStandingsVersion({ seasonId: '11111111-1111-1111-1111-111111111111' });
  assert.equal(version.matches[0].status, 'finalized');
});
