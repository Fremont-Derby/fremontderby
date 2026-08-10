import test from 'node:test';
import assert from 'node:assert/strict';
import {
  adminProposeTeamTradeExceptionCommand,
  approveTeamTradeCaptainCommand,
  cancelTeamInvitationCommand,
  createTeamWithCaptainCommand,
  invitePlayerToTeamCommand,
  listOwnTeamManagementCommand,
  listOwnTeamTradesCommand,
  proposeTeamTradeCommand,
  removeTeamMemberCommand,
  respondToTeamTradePlayerCommand,
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
    async listOwnTeamManagement(payload) {
      calls.push(['listOwnTeamManagement', payload]);
      return {
        player_id: 'player-1',
        captain_teams: [],
        invitations: [],
      };
    },
    async listOwnTeamTrades(payload) {
      calls.push(['listOwnTeamTrades', payload]);
      return {
        player_id: 'player-1',
        trades: [],
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
    async proposeTeamTrade(payload) {
      calls.push(['proposeTeamTrade', payload]);
      return {
        id: 'trade-1',
        status: 'pending',
        requesting_team_id: payload.teamId,
        requested_team_id: payload.requestedTeamId,
      };
    },
    async adminProposeTeamTradeException(payload) {
      calls.push(['adminProposeTeamTradeException', payload]);
      return {
        id: 'trade-1',
        status: 'pending',
        admin_exception: true,
      };
    },
    async respondToTeamInvitation(payload) {
      calls.push(['respondToTeamInvitation', payload]);
      return {
        id: payload.invitationId,
        status: payload.response,
      };
    },
    async respondToTeamTradePlayer(payload) {
      calls.push(['respondToTeamTradePlayer', payload]);
      return {
        id: payload.tradeId,
        status: payload.response === 'accepted' ? 'pending' : 'declined',
      };
    },
    async approveTeamTradeCaptain(payload) {
      calls.push(['approveTeamTradeCaptain', payload]);
      return {
        id: payload.tradeId,
        status: payload.response === 'approved' ? 'pending' : 'declined',
      };
    },
    async cancelTeamInvitation(payload) {
      calls.push(['cancelTeamInvitation', payload]);
      return {
        id: payload.invitationId,
        status: 'canceled',
      };
    },
    async removeTeamMember(payload) {
      calls.push(['removeTeamMember', payload]);
      return {
        id: payload.membershipId,
        ends_at: '2026-09-01T00:00:00Z',
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

test('team management command loads the authenticated actor team view', async () => {
  const repository = createRepository();

  const teamManagement = await listOwnTeamManagementCommand(
    { actorUserId: 'user-1' },
    repository,
  );

  assert.deepEqual(teamManagement, {
    player_id: 'player-1',
    captain_teams: [],
    invitations: [],
  });
  assert.deepEqual(repository.calls, [
    ['listOwnTeamManagement', { actorUserId: 'user-1' }],
  ]);
});

test('team trades command loads the authenticated actor trade view', async () => {
  const repository = createRepository();

  const tradeManagement = await listOwnTeamTradesCommand(
    { actorUserId: 'user-1' },
    repository,
  );

  assert.deepEqual(tradeManagement, {
    player_id: 'player-1',
    trades: [],
  });
  assert.deepEqual(repository.calls, [
    ['listOwnTeamTrades', { actorUserId: 'user-1' }],
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

test('trade proposal command sends a captain trade request', async () => {
  const repository = createRepository();

  const trade = await proposeTeamTradeCommand(
    {
      actorUserId: 'captain-user-1',
      teamId: 'team-1',
      offeredPlayerId: 'player-1',
      requestedTeamId: 'team-2',
      requestedPlayerId: 'player-2',
    },
    repository,
  );

  assert.equal(trade.status, 'pending');
  assert.deepEqual(repository.calls, [
    ['proposeTeamTrade', {
      actorUserId: 'captain-user-1',
      teamId: 'team-1',
      offeredPlayerId: 'player-1',
      requestedTeamId: 'team-2',
      requestedPlayerId: 'player-2',
    }],
  ]);
});

test('admin trade exception command sends an admin proposal request', async () => {
  const repository = createRepository();

  const trade = await adminProposeTeamTradeExceptionCommand(
    {
      actorUserId: 'admin-user-1',
      teamId: 'team-1',
      offeredPlayerId: 'player-1',
      requestedTeamId: 'team-2',
      requestedPlayerId: 'player-2',
    },
    repository,
  );

  assert.equal(trade.admin_exception, true);
  assert.deepEqual(repository.calls, [
    ['adminProposeTeamTradeException', {
      actorUserId: 'admin-user-1',
      teamId: 'team-1',
      offeredPlayerId: 'player-1',
      requestedTeamId: 'team-2',
      requestedPlayerId: 'player-2',
    }],
  ]);
});

test('trade proposal command rejects missing trade sides before writing', async () => {
  const repository = createRepository();

  await assert.rejects(
    () => proposeTeamTradeCommand(
      {
        actorUserId: 'captain-user-1',
        teamId: 'team-1',
        offeredPlayerId: '',
        requestedTeamId: 'team-2',
        requestedPlayerId: 'player-2',
      },
      repository,
    ),
    /offeredPlayerId is required/,
  );

  assert.deepEqual(repository.calls, []);
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

test('trade player response command allows only accepted or declined responses', async () => {
  const repository = createRepository();

  assert.deepEqual(
    await respondToTeamTradePlayerCommand(
      { actorUserId: 'user-2', tradeId: 'trade-1', response: 'accepted' },
      repository,
    ),
    { id: 'trade-1', status: 'pending' },
  );

  await assert.rejects(
    () => respondToTeamTradePlayerCommand(
      { actorUserId: 'user-2', tradeId: 'trade-1', response: 'maybe' },
      repository,
    ),
    /accepted or declined/,
  );
});

test('trade captain approval command allows only approved or declined responses', async () => {
  const repository = createRepository();

  assert.deepEqual(
    await approveTeamTradeCaptainCommand(
      { actorUserId: 'captain-user-2', tradeId: 'trade-1', response: 'approved' },
      repository,
    ),
    { id: 'trade-1', status: 'pending' },
  );

  await assert.rejects(
    () => approveTeamTradeCaptainCommand(
      { actorUserId: 'captain-user-2', tradeId: 'trade-1', response: 'accepted' },
      repository,
    ),
    /approved or declined/,
  );
});

test('cancel invitation command sends a captain cancellation request', async () => {
  const repository = createRepository();

  assert.deepEqual(
    await cancelTeamInvitationCommand(
      { actorUserId: 'captain-user-1', invitationId: 'invitation-1' },
      repository,
    ),
    { id: 'invitation-1', status: 'canceled' },
  );
  assert.deepEqual(repository.calls, [
    ['cancelTeamInvitation', {
      actorUserId: 'captain-user-1',
      invitationId: 'invitation-1',
    }],
  ]);
});

test('remove team member command sends a captain removal request', async () => {
  const repository = createRepository();

  assert.deepEqual(
    await removeTeamMemberCommand(
      { actorUserId: 'captain-user-1', membershipId: 'membership-1' },
      repository,
    ),
    { id: 'membership-1', ends_at: '2026-09-01T00:00:00Z' },
  );
  assert.deepEqual(repository.calls, [
    ['removeTeamMember', {
      actorUserId: 'captain-user-1',
      membershipId: 'membership-1',
    }],
  ]);
});
