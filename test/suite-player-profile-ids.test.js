import test from 'node:test';
import assert from 'node:assert/strict';
import { getOwnPlayerProfileCommand, saveOwnPlayerProfileCommand } from '../src/playerProfileCommands.js';
import { getAdminPlayerContactCommand, setOwnPlayerContactCommand } from '../src/playerContactCommands.js';
import { registerForSeasonCommand } from '../src/seasonRegistrationCommands.js';

function profileRepo() {
  const repo = {
    async getProfileByUserId(userId) { return { userId, displayName: 'Ada' }; },
    async saveProfile(input) { return input; },
  };
  return repo;
}
function contactRepo() {
  return {
    async setOwn(input) { return input; },
    async getAdminPlayer(input) { return input; },
  };
}
function seasonRepo() {
  return {
    async register(input) { return input; },
    async getOwnRegistration(input) { return input; },
  };
}

for (let n = 1; n <= 40; n += 1) {
  const actor = 'player-' + n;
  test('profile belongs to ' + actor, async () => {
    const profile = await getOwnPlayerProfileCommand({ actorUserId: actor }, profileRepo());
    assert.equal(profile.userId, actor);
    const saved = await saveOwnPlayerProfileCommand({ actorUserId: actor, displayName: 'Player ' + n }, profileRepo());
    assert.equal(saved.actorUserId, actor);
    assert.equal(saved.displayName, 'Player ' + n);
  });
}

for (let n = 1; n <= 30; n += 1) {
  const playerId = 'record-' + n;
  test('admin contact is for record ' + playerId, async () => {
    const contact = await getAdminPlayerContactCommand({ actorUserId: 'admin', playerId }, contactRepo());
    assert.equal(contact.playerId, playerId);
  });
}

for (let n = 1; n <= 20; n += 1) {
  test('season ' + n + ' accepts a rostered registration', async () => {
    const result = await registerForSeasonCommand(
      { actorUserId: 'u1', seasonId: 'season-' + n, participationType: 'rostered' },
      seasonRepo(),
    );
    assert.equal(result.seasonId, 'season-' + n);
  });
}

for (let n = 10; n <= 15; n += 1) {
  test('phone of exactly ' + n + ' digits clears nothing and stores the value', async () => {
    const phone = String(n).padEnd(n, '0');
    const saved = await setOwnPlayerContactCommand({ actorUserId: 'u1', phone }, contactRepo());
    assert.equal(saved.phone, phone);
  });
}
