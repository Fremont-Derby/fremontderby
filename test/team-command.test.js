import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createTeamWithCaptainCommand,
  invitePlayerToTeamCommand,
  respondToTeamInvitationCommand,
} from '../src/teamCommands.js';

function createRepository() {
  const calls = [];

  return {
    calls,
    async createTeamWithCaptain(payload) {
      calls.push(['createTeamWithCaptain', payload]);
      return {
        id: 'team-1',
        season_id: payload.seasonId,
        name: payload.teamName,
        captain_player_id: 'player-1',
      };
    },
    async invitePlayerToTeam(payload) {
      calls.push(['invitePlayerToTeam', payload]);
      return {
        id: 'invitation-1',
        team_id: payload.teamId,
        invited_player_id: payload.playerId,
        status: 'pending',
      };
    },
    async respondToTeamInvitation(payload) {
      calls.push(['respondToTeamInvitation', payload]);
      return {
        id: payload.invitationId,
        status: payload.response,
      };
    },
  };
}

test('team creation command creates a team for the authenticated actor', async () => {
  const repository = createRepository();

  const team = await createTeamWithCaptainCommand(
    {
      actorUserId: 'user-1',
      seasonId: 'season-1',
      teamName: '  Breakers  ',
    },
    repository,
  );

  assert.deepEqual(team, {
    id: 'team-1',
    season_id: 'season-1',
    name: 'Breakers',
    captain_player_id: 'player-1',
  });
  assert.deepEqual(repository.calls, [
    ['createTeamWithCaptain', {
      actorUserId: 'user-1',
      seasonId: 'season-1',
      teamName: 'Breakers',
    }],
  ]);
});

test('team creation command rejects invalid team names before writing', async () => {
  const repository = createRepository();

  await assert.rejects(
    () => createTeamWithCaptainCommand(
      { actorUserId: 'user-1', seasonId: 'season-1', teamName: ' ' },
      repository,
    ),
    /teamName is required/,
  );
  await assert.rejects(
    () => createTeamWithCaptainCommand(
      { actorUserId: 'user-1', seasonId: 'season-1', teamName: 'x'.repeat(81) },
      repository,
    ),
    /80 characters or fewer/,
  );

  assert.deepEqual(repository.calls, []);
});

test('invite command sends a captain invitation request', async () => {
  const repository = createRepository();

  const invitation = await invitePlayerToTeamCommand(
    { actorUserId: 'captain-user-1', teamId: 'team-1', playerId: 'player-2' },
    repository,
  );

  assert.deepEqual(invitation, {
    id: 'invitation-1',
    team_id: 'team-1',
    invited_player_id: 'player-2',
    status: 'pending',
  });
  assert.deepEqual(repository.calls, [
    ['invitePlayerToTeam', {
      actorUserId: 'captain-user-1',
      teamId: 'team-1',
      playerId: 'player-2',
    }],
  ]);
});

test('respond command allows only accepted or declined responses', async () => {
  const repository = createRepository();

  assert.deepEqual(
    await respondToTeamInvitationCommand(
      { actorUserId: 'user-2', invitationId: 'invitation-1', response: 'accepted' },
      repository,
    ),
    { id: 'invitation-1', status: 'accepted' },
  );

  await assert.rejects(
    () => respondToTeamInvitationCommand(
      { actorUserId: 'user-2', invitationId: 'invitation-1', response: 'maybe' },
      repository,
    ),
    /accepted or declined/,
  );
});
