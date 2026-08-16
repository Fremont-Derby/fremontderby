import assert from 'node:assert/strict';
import test from 'node:test';
import {
  archiveSeasonCommand,
  cancelSeasonCommand,
  getSeasonLifecycleReadinessCommand,
  safeDeleteSeasonCommand,
} from '../src/seasonLifecycleCommands.js';
import { statusForError } from '../src/seasonLifecycleHttp.js';
import { AuthError } from '../src/supabaseAuth.js';

test('cancel requires a real reason', async () => {
  await assert.rejects(
    () => cancelSeasonCommand({ actorUserId: 'a', seasonId: 's', reason: 'no' }, {
      cancelSeason: async () => ({ season_status: 'cancelled' }),
    }),
    /Cancel reason/,
  );
});

test('commands call repository methods', async () => {
  const calls = [];
  const repo = {
    async getLifecycleReadiness(input) { calls.push(['ready', input]); return { can_cancel: true }; },
    async cancelSeason(input) { calls.push(['cancel', input]); return { season_status: 'cancelled' }; },
    async archiveSeason(input) { calls.push(['archive', input]); return { season_status: 'archived' }; },
    async safeDeleteSeason(input) { calls.push(['delete', input]); return { deleted: true }; },
  };
  await getSeasonLifecycleReadinessCommand({ actorUserId: 'actor', seasonId: 'season' }, repo);
  await cancelSeasonCommand({ actorUserId: 'actor', seasonId: 'season', reason: 'Weather cancelled the league' }, repo);
  await archiveSeasonCommand({ actorUserId: 'actor', seasonId: 'season' }, repo);
  await safeDeleteSeasonCommand({ actorUserId: 'actor', seasonId: 'season' }, repo);
  assert.equal(calls.length, 4);
  assert.equal(calls[1][1].reason.includes('Weather'), true);
});

test('HTTP status mapping for lifecycle failures', () => {
  assert.equal(statusForError(new AuthError('Missing bearer token', 401)), 401);
  assert.equal(statusForError(new Error('Actor is not a league admin')), 403);
  assert.equal(statusForError(new Error('Season not found')), 404);
  assert.equal(statusForError(new Error('Safe delete is only for empty draft seasons.')), 400);
});
