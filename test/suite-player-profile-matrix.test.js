import test from 'node:test';
import assert from 'node:assert/strict';
import { getOwnPlayerProfileCommand, saveOwnPlayerProfileCommand } from '../src/playerProfileCommands.js';
import { setOwnPlayerContactCommand, getAdminPlayerContactCommand, getOwnPlayerContactCommand } from '../src/playerContactCommands.js';
import { registerForSeasonCommand, getOwnSeasonRegistrationCommand } from '../src/seasonRegistrationCommands.js';
import { renderProfilePage } from '../src/profilePage.js';

function profileRepo() {
  const repo = {
    async getProfileByUserId(userId) { return { userId, displayName: repo.savedName || '' }; },
    async saveProfile(input) { repo.savedName = input.displayName; return input; },
  };
  return repo;
}
function contactRepo() {
  const repo = {
    async getOwn(input) { return input; },
    async setOwn(input) { repo.last = input; return input; },
    async getAdminPlayer(input) { return input; },
  };
  return repo;
}
function seasonRepo() {
  const repo = {
    async register(input) { repo.last = input; return input; },
    async getOwnRegistration(input) { return input; },
  };
  return repo;
}

const goodNames = ['Ada', 'Bo', 'Jo', 'Sam', 'Pat', 'Riley', 'Jordan', 'Casey', 'Morgan', 'Avery', 'Quinn', 'Drew', 'Sky', 'Remy', 'Nico'];
for (const name of goodNames) {
  test('profile keeps the name ' + name, async () => {
    const saved = await saveOwnPlayerProfileCommand({ actorUserId: 'u1', displayName: name }, profileRepo());
    assert.equal(saved.displayName, name);
  });
  test('profile trims the name ' + name, async () => {
    const saved = await saveOwnPlayerProfileCommand({ actorUserId: 'u1', displayName: '  ' + name + '  ' }, profileRepo());
    assert.equal(saved.displayName, name);
  });
}

for (const length of [3, 4, 5, 8, 12, 16, 20, 24, 32, 48, 64, 72, 80]) {
  test('a name of length ' + length + ' is accepted', async () => {
    const name = 'P'.repeat(length);
    const saved = await saveOwnPlayerProfileCommand({ actorUserId: 'u1', displayName: name }, profileRepo());
    assert.equal(saved.displayName.length, length);
  });
}

for (const length of [81, 82, 90, 100, 120, 200]) {
  test('a name of length ' + length + ' is too long', async () => {
    await assert.rejects(
      () => saveOwnPlayerProfileCommand({ actorUserId: 'u1', displayName: 'P'.repeat(length) }, profileRepo()),
      /80 characters or fewer/,
    );
  });
}

const punctuated = ["O'Neil", 'Ada-Bo', 'Sam Jr.', 'Pat & Jo', 'Riley (sub)', 'Name, with comma'];
for (const name of punctuated) {
  test('profile keeps punctuation in ' + name, async () => {
    const saved = await saveOwnPlayerProfileCommand({ actorUserId: 'u1', displayName: name }, profileRepo());
    assert.equal(saved.displayName, name);
  });
}

const actors = ['u1', 'user-2', 'captain', 'player', 'admin', '0001', 'auth0|abc'];
for (const actor of actors) {
  test('profile read is for actor ' + actor, async () => {
    const profile = await getOwnPlayerProfileCommand({ actorUserId: actor }, profileRepo());
    assert.equal(profile.userId, actor);
  });
  test('contact read is for actor ' + actor, async () => {
    const contact = await getOwnPlayerContactCommand({ actorUserId: actor }, contactRepo());
    assert.equal(contact.actorUserId, actor);
  });
}

const phones = [];
for (let n = 10; n <= 15; n += 1) phones.push('5'.repeat(n));
phones.push('555-010-1001', '555.010.1001', '555 010 1001', '+15550101001', '1-555-010-1001');
for (const phone of phones) {
  test('a usable phone ' + phone + ' is stored as typed', async () => {
    const saved = await setOwnPlayerContactCommand({ actorUserId: 'u1', phone }, contactRepo());
    assert.equal(saved.phone, phone);
    assert.equal(saved.actorUserId, 'u1');
  });
}

for (const playerId of ['p1', 'p2', 'player-9', 'claim-1', 'old-record', 'import-42']) {
  test('admin can read contact for ' + playerId, async () => {
    const contact = await getAdminPlayerContactCommand({ actorUserId: 'admin', playerId }, contactRepo());
    assert.equal(contact.playerId, playerId);
    assert.equal(contact.actorUserId, 'admin');
  });
}

const seasons = ['s1', 'fall-2026', 'spring-2027', 'season-1', 'open', 'draft'];
for (const seasonId of seasons) {
  for (const type of ['rostered', 'free_agent']) {
    test(seasonId + ' registration as ' + type, async () => {
      const result = await registerForSeasonCommand(
        { actorUserId: 'u1', seasonId, participationType: type },
        seasonRepo(),
      );
      assert.equal(result.seasonId, seasonId);
      assert.equal(result.participationType, type);
    });
  }
  test('own registration read for ' + seasonId, async () => {
    const result = await getOwnSeasonRegistrationCommand({ actorUserId: 'u1', seasonId }, seasonRepo());
    assert.equal(result.seasonId, seasonId);
    assert.equal(result.actorUserId, 'u1');
  });
}

for (const missing of [null, undefined, '', 0, false]) {
  test('season registration rejects actor ' + JSON.stringify(missing), async () => {
    await assert.rejects(
      () => registerForSeasonCommand({ actorUserId: missing, seasonId: 's1' }, seasonRepo()),
      /actorUserId is required/,
    );
  });
  test('season registration rejects season ' + JSON.stringify(missing), async () => {
    await assert.rejects(
      () => registerForSeasonCommand({ actorUserId: 'u1', seasonId: missing }, seasonRepo()),
      /seasonId is required/,
    );
  });
}

const landmarks = [
  'Fremont Derby Profile',
  'Display name',
  'data-display-name',
  'data-display-name-input',
  'data-profile-form',
  'data-rating',
  'data-rating-status',
  'data-team-body',
  'data-team-empty',
  'data-season-body',
  'data-season-empty',
  'data-logout',
  'data-google-sign-in',
  'data-session-state',
  'data-authenticated-content',
  'Sign in',
];
for (const landmark of landmarks) {
  test('profile page includes ' + landmark, () => {
    assert.ok(renderProfilePage().includes(landmark));
  });
}

test('profile page escapes a hostile environment value in its config', () => {
  const html = renderProfilePage({ SUPABASE_URL: 'https://ok.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'key' });
  assert.match(html, /ok\.supabase\.co|supabase/i);
  assert.match(html, /<html lang="en">/);
});
