import assert from 'node:assert/strict';
import test from 'node:test';
import { KID_LEAGUE_SEASON_NAME, KID_LEAGUE_TEAMS } from '../src/druKidLeagueCatalog.js';
import { seedDruKidLeague } from '../src/druKidLeagueSeed.js';
import { routeDruKidLeagueSeed } from '../src/druKidLeagueSeedHttp.js';

test('kid league catalog stays child-appropriate and obviously fake', () => {
  assert.equal(KID_LEAGUE_TEAMS.length, 8);
  const blob = JSON.stringify(KID_LEAGUE_TEAMS).toLowerCase();
  assert.doesNotMatch(blob, /kill|sex|drug|hate|damn|hell|gun/);
  assert.match(blob, /penny eightball/);
});

test('seed creates the demo season and eight teams once', async () => {
  const created = [];
  const result = await seedDruKidLeague({
    actorUserId: 'actor-1',
    listSeasons: async () => [],
    saveSeasonSetup: async (input) => {
      assert.equal(input.seasonName, KID_LEAGUE_SEASON_NAME);
      return { id: 'season-kids' };
    },
    listSeasonTeams: async () => [],
    createPreparedTeam: async ({ teamName }) => {
      created.push(teamName);
      return { team_id: `team-${created.length}` };
    },
    addTeamToSeason: async () => ({ ok: true }),
    createPlayer: async ({ displayName }) => ({ playerId: `p-${displayName}` }),
    setRosterMembership: async () => ({ ok: true }),
    assignCaptain: async () => ({ ok: true }),
  });

  assert.equal(result.seasonId, 'season-kids');
  assert.equal(result.createdSeason, true);
  assert.equal(created.length, 8);
  assert.deepEqual(created, KID_LEAGUE_TEAMS.map((team) => team.teamName));
});

test('seed is idempotent when the season and teams already exist', async () => {
  let setups = 0;
  let prepared = 0;
  const result = await seedDruKidLeague({
    actorUserId: 'actor-1',
    listSeasons: async () => [{ id: 'season-kids', name: KID_LEAGUE_SEASON_NAME }],
    saveSeasonSetup: async () => {
      setups += 1;
      return { id: 'season-kids' };
    },
    listSeasonTeams: async () => KID_LEAGUE_TEAMS.map((team) => ({ team_name: team.teamName })),
    createPreparedTeam: async () => {
      prepared += 1;
      return { team_id: 'nope' };
    },
    addTeamToSeason: async () => ({ ok: true }),
    createPlayer: async () => ({ playerId: 'nope' }),
    setRosterMembership: async () => ({ ok: true }),
    assignCaptain: async () => ({ ok: true }),
  });
  assert.equal(result.createdSeason, false);
  assert.equal(setups, 0);
  assert.equal(prepared, 0);
  assert.equal(result.teams.every((team) => team.created === false), true);
});

test('seed HTTP is missing outside DRU', async () => {
  const response = await routeDruKidLeagueSeed(
    new Request('https://gamma.fremontderby.test/api/dru/kid-league-seed', { method: 'POST' }),
    { ENVIRONMENT: 'gamma' },
  );
  assert.equal(response.status, 404);
});

test('seed HTTP catalog is readable on DRU without a body', async () => {
  const response = await routeDruKidLeagueSeed(
    new Request('https://dru.fremontderby.test/api/dru/kid-league-seed'),
    { ENVIRONMENT: 'dru' },
  );
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.seasonName, KID_LEAGUE_SEASON_NAME);
  assert.equal(body.teams.length, 8);
});
