import test from 'node:test';
import assert from 'node:assert/strict';
import { createTeamRepository } from '../src/teamRepository.js';

function createFetch(responses) {
  const calls = [];

  const fetch = async (url, init) => {
    calls.push({ url, init });
    const response = responses.shift();
    return new Response(
      response.body === undefined ? null : JSON.stringify(response.body),
      {
        status: response.status ?? 200,
        headers: { 'content-type': 'application/json' },
      },
    );
  };

  return { fetch, calls };
}

const env = {
  SUPABASE_URL: 'https://project.supabase.co/',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-secret',
};

test('team repository creates a team through the captain RPC', async () => {
  const { fetch, calls } = createFetch([
    {
      body: [{
        id: 'team-1',
        season_id: 'season-1',
        name: 'Breakers',
        captain_player_id: 'player-1',
      }],
    },
  ]);
  const repository = createTeamRepository(env, { fetch });

  const team = await repository.createTeamWithCaptain({
    actorUserId: 'user-1',
    seasonId: 'season-1',
    teamName: 'Breakers',
  });

  assert.deepEqual(team, {
    id: 'team-1',
    season_id: 'season-1',
    name: 'Breakers',
    captain_player_id: 'player-1',
  });
  assert.equal(calls[0].url, 'https://project.supabase.co/rest/v1/rpc/create_team_with_captain');
  assert.equal(calls[0].init.headers.apikey, 'service-role-secret');
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    actor_user_id: 'user-1',
    target_season_id: 'season-1',
    team_name: 'Breakers',
  });
});

test('team repository surfaces Supabase failures', async () => {
  const { fetch } = createFetch([
    { status: 400, body: { message: 'Player profile is required before creating a team' } },
  ]);
  const repository = createTeamRepository(env, { fetch });

  await assert.rejects(
    () => repository.createTeamWithCaptain({
      actorUserId: 'user-1',
      seasonId: 'season-1',
      teamName: 'Breakers',
    }),
    /Player profile is required/,
  );
});

test('team repository invites a player through the invitation RPC', async () => {
  const { fetch, calls } = createFetch([
    {
      body: [{
        id: 'invitation-1',
        season_id: 'season-1',
        team_id: 'team-1',
        invited_player_id: 'player-2',
        status: 'pending',
      }],
    },
  ]);
  const repository = createTeamRepository(env, { fetch });

  const invitation = await repository.invitePlayerToTeam({
    actorUserId: 'captain-user-1',
    teamId: 'team-1',
    playerId: 'player-2',
  });

  assert.equal(calls[0].url, 'https://project.supabase.co/rest/v1/rpc/invite_player_to_team');
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    actor_user_id: 'captain-user-1',
    target_team_id: 'team-1',
    target_player_id: 'player-2',
  });
  assert.equal(invitation.status, 'pending');
});

test('team repository responds to an invitation through the response RPC', async () => {
  const { fetch, calls } = createFetch([
    {
      body: [{
        id: 'invitation-1',
        season_id: 'season-1',
        team_id: 'team-1',
        invited_player_id: 'player-2',
        status: 'accepted',
      }],
    },
  ]);
  const repository = createTeamRepository(env, { fetch });

  const invitation = await repository.respondToTeamInvitation({
    actorUserId: 'user-2',
    invitationId: 'invitation-1',
    response: 'accepted',
  });

  assert.equal(calls[0].url, 'https://project.supabase.co/rest/v1/rpc/respond_to_team_invitation');
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    actor_user_id: 'user-2',
    target_invitation_id: 'invitation-1',
    response_status: 'accepted',
  });
  assert.equal(invitation.status, 'accepted');
});

test('team repository cancels an invitation through the cancellation RPC', async () => {
  const { fetch, calls } = createFetch([
    {
      body: [{
        id: 'invitation-1',
        status: 'canceled',
      }],
    },
  ]);
  const repository = createTeamRepository(env, { fetch });

  const invitation = await repository.cancelTeamInvitation({
    actorUserId: 'captain-user-1',
    invitationId: 'invitation-1',
  });

  assert.equal(calls[0].url, 'https://project.supabase.co/rest/v1/rpc/cancel_team_invitation');
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    actor_user_id: 'captain-user-1',
    target_invitation_id: 'invitation-1',
  });
  assert.equal(invitation.status, 'canceled');
});

test('team repository removes a team member through the removal RPC', async () => {
  const { fetch, calls } = createFetch([
    {
      body: [{
        id: 'membership-1',
        team_id: 'team-1',
        player_id: 'player-2',
        role: 'player',
        ends_at: '2026-09-01T00:00:00Z',
      }],
    },
  ]);
  const repository = createTeamRepository(env, { fetch });

  const membership = await repository.removeTeamMember({
    actorUserId: 'captain-user-1',
    membershipId: 'membership-1',
  });

  assert.equal(calls[0].url, 'https://project.supabase.co/rest/v1/rpc/remove_team_member');
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    actor_user_id: 'captain-user-1',
    target_membership_id: 'membership-1',
  });
  assert.equal(membership.ends_at, '2026-09-01T00:00:00Z');
});
