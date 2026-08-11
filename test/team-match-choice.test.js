import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  chooseTeamMatchTeamCommand,
  listMyTeamMatchChoicesCommand,
} from '../src/teamMatchChoiceCommands.js';
import { createTeamMatchChoiceRepository } from '../src/teamMatchChoiceRepository.js';
import { teamMatchChoiceHttpHandlers } from '../src/teamMatchChoiceHttp.js';

const migrationUrl = new URL(
  '../supabase/migrations/20260811124500_player_team_match_choice.sql',
  import.meta.url,
);

function repositoryDouble() {
  const calls = [];
  return {
    calls,
    async listMyTeamMatchChoices(payload) {
      calls.push(['list', payload]);
      return [{ team_match_id: 'match-1' }];
    },
    async chooseTeamMatchTeam(payload) {
      calls.push(['choose', payload]);
      return { team_match_id: payload.teamMatchId, team_id: payload.teamId };
    },
  };
}

test('player lists conflicts and chooses one team for a matchup', async () => {
  const repository = repositoryDouble();
  assert.deepEqual(
    await listMyTeamMatchChoicesCommand({ actorUserId: 'user-1' }, repository),
    [{ team_match_id: 'match-1' }],
  );
  assert.deepEqual(
    await chooseTeamMatchTeamCommand({
      actorUserId: 'user-1',
      teamMatchId: 'match-1',
      teamId: 'team-a',
    }, repository),
    { team_match_id: 'match-1', team_id: 'team-a' },
  );
  assert.deepEqual(repository.calls, [
    ['list', { actorUserId: 'user-1' }],
    ['choose', { actorUserId: 'user-1', teamMatchId: 'match-1', teamId: 'team-a' }],
  ]);
});

test('team choice command requires a matchup and team before writing', async () => {
  const repository = repositoryDouble();
  await assert.rejects(
    () => chooseTeamMatchTeamCommand({
      actorUserId: 'user-1', teamMatchId: '', teamId: 'team-a',
    }, repository),
    /teamMatchId is required/,
  );
  await assert.rejects(
    () => chooseTeamMatchTeamCommand({
      actorUserId: 'user-1', teamMatchId: 'match-1', teamId: '',
    }, repository),
    /teamId is required/,
  );
  assert.deepEqual(repository.calls, []);
});

test('repository calls only the trusted team-choice functions', async () => {
  const calls = [];
  const fetch = async (url, init) => {
    calls.push({ url, init });
    const body = url.endsWith('list_my_team_match_choices')
      ? [{ team_match_id: 'match-1' }]
      : [{ team_match_id: 'match-1', team_id: 'team-b' }];
    return new Response(JSON.stringify(body), { status: 200 });
  };
  const repository = createTeamMatchChoiceRepository({
    SUPABASE_URL: 'https://project.supabase.co/',
    SUPABASE_SERVICE_ROLE_KEY: 'secret',
  }, { fetch });

  await repository.listMyTeamMatchChoices({ actorUserId: 'user-1' });
  await repository.chooseTeamMatchTeam({
    actorUserId: 'user-1', teamMatchId: 'match-1', teamId: 'team-b',
  });

  assert.equal(calls.length, 2);
  assert.match(calls[0].url, /rpc\/list_my_team_match_choices$/);
  assert.deepEqual(JSON.parse(calls[0].init.body), { actor_user_id: 'user-1' });
  assert.match(calls[1].url, /rpc\/choose_team_match_team$/);
  assert.deepEqual(JSON.parse(calls[1].init.body), {
    actor_user_id: 'user-1',
    target_team_match_id: 'match-1',
    target_team_id: 'team-b',
  });
});

test('authenticated player can save a team choice through the HTTP boundary', async () => {
  const responses = [
    new Response(JSON.stringify({ id: 'user-1' }), { status: 200 }),
    new Response(JSON.stringify([{
      team_match_id: 'match-1', player_id: 'player-1', team_id: 'team-a',
    }]), { status: 200 }),
  ];
  const fetch = async () => responses.shift();
  const request = new Request('https://fremontderby.com/api/team-matches/match-1/team-choice/me', {
    method: 'PUT',
    headers: { authorization: 'Bearer token' },
    body: JSON.stringify({ teamId: 'team-a' }),
  });
  const response = await teamMatchChoiceHttpHandlers.choose(
    request,
    {
      SUPABASE_URL: 'https://project.supabase.co',
      SUPABASE_PUBLISHABLE_KEY: 'publishable',
      SUPABASE_SERVICE_ROLE_KEY: 'secret',
    },
    'match-1',
    { fetch },
  );
  assert.equal(response.status, 200);
  assert.equal((await response.json()).choice.team_id, 'team-a');
});

test('migration enforces player choice and one appearance across all lineup paths', async () => {
  const sql = await readFile(migrationUrl, 'utf8');
  assert.match(sql, /create table private\.team_match_player_choices/i);
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /list_my_team_match_choices/i);
  assert.match(sql, /choose_team_match_team/i);
  assert.match(sql, /before insert or update[\s\S]*private\.team_lineup_slots/i);
  assert.match(sql, /cannot appear twice in the same team matchup/i);
  assert.match(sql, /must choose a team for this matchup before lineups are locked/i);
  assert.match(sql, /Playing for the opponent in this matchup/i);
  assert.match(sql, /grant execute[\s\S]*to service_role/i);
  assert.match(sql, /revoke all[\s\S]*anon, authenticated/i);
});
