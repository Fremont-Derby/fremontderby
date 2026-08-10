import test from 'node:test';
import assert from 'node:assert/strict';
import { publishSeasonScheduleCommand } from '../src/seasonCommands.js';

const teams = Array.from({ length: 8 }, (_, index) => ({ id: `team-${index + 1}` }));

function createRepository({
  season = { id: 'season-1', status: 'draft' },
  seasonTeams = teams,
} = {}) {
  const calls = [];

  return {
    calls,
    async getSeason(seasonId) {
      calls.push(['getSeason', seasonId]);
      return season;
    },
    async listSeasonTeams(seasonId) {
      calls.push(['listSeasonTeams', seasonId]);
      return seasonTeams;
    },
    async savePublishedSchedule(payload) {
      calls.push(['savePublishedSchedule', payload]);
      return { savedRoundCount: payload.rounds.length };
    },
  };
}

test('trusted command persists a generated schedule for a draft season', async () => {
  const repository = createRepository();

  const result = await publishSeasonScheduleCommand(
    {
      seasonId: 'season-1',
      actorUserId: 'admin-user-1',
      firstRoundDate: '2026-09-03',
      tableNumbers: [3, 4, 5, 6],
    },
    repository,
  );

  assert.deepEqual(result, {
    seasonId: 'season-1',
    status: 'active',
    roundCount: 7,
    teamMatchCount: 28,
    saved: { savedRoundCount: 7 },
  });

  const saveCall = repository.calls.find(([name]) => name === 'savePublishedSchedule');
  assert.ok(saveCall);
  assert.equal(saveCall[1].actorUserId, 'admin-user-1');
  assert.equal(saveCall[1].previousStatus, 'draft');
  assert.equal(saveCall[1].nextStatus, 'active');
  assert.equal(saveCall[1].rounds.length, 7);
  assert.equal(saveCall[1].rounds[0].matches.length, 4);
  assert.deepEqual(
    saveCall[1].rounds[0].matches.map((match) => match.tableNumber),
    [3, 4, 5, 6],
  );
});

test('trusted command can publish a registration season', async () => {
  const repository = createRepository({
    season: { id: 'season-1', status: 'registration' },
  });

  const result = await publishSeasonScheduleCommand(
    {
      seasonId: 'season-1',
      actorUserId: 'admin-user-1',
      firstRoundDate: '2026-09-03',
    },
    repository,
  );

  assert.equal(result.status, 'active');
  assert.equal(repository.calls.at(-1)[0], 'savePublishedSchedule');
});

test('trusted command rejects already-published seasons before writing', async () => {
  const repository = createRepository({
    season: { id: 'season-1', status: 'active' },
  });

  await assert.rejects(
    () => publishSeasonScheduleCommand(
      {
        seasonId: 'season-1',
        actorUserId: 'admin-user-1',
        firstRoundDate: '2026-09-03',
      },
      repository,
    ),
    /draft or registration/,
  );

  assert.deepEqual(repository.calls, [['getSeason', 'season-1']]);
});

test('trusted command rejects short team lists before writing', async () => {
  const repository = createRepository({ seasonTeams: teams.slice(0, 7) });

  await assert.rejects(
    () => publishSeasonScheduleCommand(
      {
        seasonId: 'season-1',
        actorUserId: 'admin-user-1',
        firstRoundDate: '2026-09-03',
      },
      repository,
    ),
    /exactly 8 teams/,
  );

  assert.equal(
    repository.calls.some(([name]) => name === 'savePublishedSchedule'),
    false,
  );
});

test('trusted command requires an actor before reading season state', async () => {
  const repository = createRepository();

  await assert.rejects(
    () => publishSeasonScheduleCommand(
      {
        seasonId: 'season-1',
        firstRoundDate: '2026-09-03',
      },
      repository,
    ),
    /actorUserId/,
  );

  assert.deepEqual(repository.calls, []);
});
