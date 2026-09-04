import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getOwnPlayerProfileCommand,
  saveOwnPlayerProfileCommand,
} from '../src/playerProfileCommands.js';

function createRepository(profile = { id: 'player-1', user_id: 'user-1', display_name: 'Kai' }) {
  const calls = [];

  return {
    calls,
    async getProfileByUserId(actorUserId) {
      calls.push(['getProfileByUserId', actorUserId]);
      return profile;
    },
    async saveProfile(payload) {
      calls.push(['saveProfile', payload]);
      return {
        id: 'player-1',
        user_id: payload.actorUserId,
        display_name: payload.displayName,
      };
    },
    async saveStandingAvailability(payload) {
      calls.push(['saveStandingAvailability', payload]);
      return payload;
    },
  };
}

test('profile read command loads only the authenticated actor profile', async () => {
  const repository = createRepository();
  const profile = await getOwnPlayerProfileCommand(
    { actorUserId: 'user-1' },
    repository,
  );
  assert.deepEqual(profile, { id: 'player-1', user_id: 'user-1', display_name: 'Kai' });
  assert.deepEqual(repository.calls, [['getProfileByUserId', 'user-1']]);
});

test('profile save command trims and saves allowed profile fields', async () => {
  const repository = createRepository();
  const profile = await saveOwnPlayerProfileCommand(
    { actorUserId: 'user-1', displayName: '  Kai B  ' },
    repository,
  );
  assert.deepEqual(profile, { id: 'player-1', user_id: 'user-1', display_name: 'Kai B' });
  assert.deepEqual(repository.calls, [
    ['saveProfile', { actorUserId: 'user-1', displayName: 'Kai B', fargoExternalId: undefined }],
  ]);
});

test('profile save command rejects invalid display names before writing', async () => {
  const repository = createRepository();
  await assert.rejects(
    () => saveOwnPlayerProfileCommand(
      { actorUserId: 'user-1', displayName: '   ' },
      repository,
    ),
    /displayName is required/,
  );
  await assert.rejects(
    () => saveOwnPlayerProfileCommand(
      { actorUserId: 'user-1', displayName: 'x'.repeat(81) },
      repository,
    ),
    /80 characters or fewer/,
  );
  assert.deepEqual(repository.calls, []);
});
