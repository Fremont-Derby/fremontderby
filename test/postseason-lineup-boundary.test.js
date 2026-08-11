import assert from 'node:assert/strict';
import test from 'node:test';

import { submitPostseasonLineupCommand } from '../src/playoffCommands.js';
import { createPlayoffHttpHandlers } from '../src/playoffHttp.js';
import { createPlayoffRepository } from '../src/playoffRepository.js';

const input = {
  actorUserId: 'user-1',
  teamMatchId: 'match-1',
  teamId: 'team-1',
  playerIds: ['p1', 'p2', 'p3', 'p4'],
  anchorPlayerId: 'p3',
};

test('postseason lineup command requires four unique players and an anchor from the lineup', async () => {
  await assert.rejects(
    submitPostseasonLineupCommand({ ...input, playerIds: ['p1', 'p2', 'p3'] }, { submitPostseasonLineup() {} }),
    /exactly four players/,
  );
  await assert.rejects(
    submitPostseasonLineupCommand({ ...input, playerIds: ['p1', 'p1', 'p3', 'p4'] }, { submitPostseasonLineup() {} }),
    /must be unique/,
  );
  await assert.rejects(
    submitPostseasonLineupCommand({ ...input, anchorPlayerId: 'p9' }, { submitPostseasonLineup() {} }),
    /selected from the submitted lineup/,
  );
});

test('postseason lineup repository invokes only the trusted service-role RPC', async () => {
  let captured;
  const repository = createPlayoffRepository(
    {
      SUPABASE_URL: 'https://example.supabase.co/',
      SUPABASE_SERVICE_ROLE_KEY: 'server-secret',
    },
    {
      fetch: async (url, init) => {
        captured = { url, init };
        return Response.json([{ lineup_id: 'lineup-1', slot_number: 1 }]);
      },
    },
  );

  const result = await repository.submitPostseasonLineup(input);
  assert.equal(captured.url, 'https://example.supabase.co/rest/v1/rpc/submit_postseason_lineup');
  assert.equal(captured.init.headers.authorization, 'Bearer server-secret');
  assert.deepEqual(JSON.parse(captured.init.body), {
    actor_user_id: 'user-1',
    target_team_match_id: 'match-1',
    target_team_id: 'team-1',
    lineup_player_ids: ['p1', 'p2', 'p3', 'p4'],
    anchor_player_id: 'p3',
  });
  assert.equal(result.length, 1);
});

test('postseason lineup HTTP handler uses authenticated actor instead of accepting actor identity from body', async () => {
  const calls = [];
  const handlers = createPlayoffHttpHandlers({
    authenticate: async () => ({ id: 'signed-in-user' }),
    createRepository: () => ({
      async submitPostseasonLineup(value) {
        calls.push(value);
        return [{ lineup_id: 'lineup-1' }];
      },
    }),
  });
  const request = new Request('https://fremontderby.com/api/team-matches/match-1/postseason-lineup', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: 'Bearer browser-session' },
    body: JSON.stringify({
      actorUserId: 'spoofed-user',
      teamId: 'team-1',
      playerIds: ['p1', 'p2', 'p3', 'p4'],
      anchorPlayerId: 'p3',
    }),
  });

  const response = await handlers.submitLineup(request, {}, 'match-1');
  assert.equal(response.status, 201);
  assert.deepEqual(calls, [{
    actorUserId: 'signed-in-user',
    teamMatchId: 'match-1',
    teamId: 'team-1',
    playerIds: ['p1', 'p2', 'p3', 'p4'],
    anchorPlayerId: 'p3',
  }]);
});

test('postseason lineup HTTP handler maps captain and locked-lineup failures', async () => {
  for (const [message, expectedStatus] of [
    ['Only the active captain can submit a postseason lineup', 403],
    ['Postseason lineup and anchor are locked after submission', 409],
  ]) {
    const handlers = createPlayoffHttpHandlers({
      authenticate: async () => ({ id: 'user-1' }),
      createRepository: () => ({ async submitPostseasonLineup() { throw new Error(message); } }),
    });
    const request = new Request('https://fremontderby.com/api/team-matches/match-1/postseason-lineup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ teamId: 'team-1', playerIds: ['p1', 'p2', 'p3', 'p4'], anchorPlayerId: 'p3' }),
    });
    const response = await handlers.submitLineup(request, {}, 'match-1');
    assert.equal(response.status, expectedStatus, message);
  }
});
