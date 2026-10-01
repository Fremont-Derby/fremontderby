import assert from 'node:assert/strict';
import test from 'node:test';
import { createTeamMembershipRequestRepository } from '../src/teamMembershipRequestRepository.js';

test('membership request repository requires Supabase URL and service role', () => {
  assert.throws(
    () => createTeamMembershipRequestRepository({ SUPABASE_SERVICE_ROLE_KEY: 'secret' }),
    /SUPABASE_URL is required/,
  );
  assert.throws(
    () => createTeamMembershipRequestRepository({ SUPABASE_URL: 'https://example.supabase.co' }),
    /SUPABASE_SERVICE_ROLE_KEY is required/,
  );
  assert.throws(
    () => createTeamMembershipRequestRepository(
      {
        SUPABASE_URL: 'https://example.supabase.co',
        SUPABASE_SERVICE_ROLE_KEY: 'secret',
      },
      { fetch: null },
    ),
    /fetch implementation is required/,
  );
});

test('listOwn preserves full joinable team arrays from list RPC', async () => {
  const fetchImpl = async (url) => {
    if (String(url).includes('/rpc/get_own_team_membership_requests')) {
      return new Response(JSON.stringify({
        player_requests: [{ teamId: 'team-1', status: 'pending', requestId: 'req-1' }],
        captain_requests: [],
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    if (String(url).includes('/players?')) {
      return new Response(JSON.stringify([{ id: 'player-1' }]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    if (String(url).includes('/team_memberships?')) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    if (String(url).includes('/rpc/list_joinable_team_registration')) {
      return new Response(JSON.stringify([
        {
          team_id: 'team-1',
          team_name: 'Breakers',
          season_id: 'season-1',
          season_name: 'S1',
          season_status: 'registration',
          slot_status: 'open',
        },
        {
          team_id: 'team-2',
          team_name: 'Rails',
          season_id: 'season-1',
          season_name: 'S1',
          season_status: 'registration',
          slot_status: 'open',
        },
      ]), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    throw new Error(`unexpected ${url}`);
  };

  const repo = createTeamMembershipRequestRepository({
    SUPABASE_URL: 'https://example.supabase.co/',
    SUPABASE_SERVICE_ROLE_KEY: 'server-secret',
  }, { fetch: fetchImpl });

  const result = await repo.listOwn({ actorUserId: 'user-1' });
  assert.equal(result.joinable_teams.length, 2);
  assert.equal(result.joinable_teams[0].teamName, 'Breakers');
  assert.equal(result.joinable_teams[0].pendingRequestId, 'req-1');
  assert.equal(result.joinable_teams[1].teamName, 'Rails');
  assert.equal(result.joinable_teams[1].pendingRequestId, null);
});
