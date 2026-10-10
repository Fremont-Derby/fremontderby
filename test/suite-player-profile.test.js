import test from 'node:test';
import assert from 'node:assert/strict';
import { getOwnPlayerProfileCommand, saveOwnPlayerProfileCommand } from '../src/playerProfileCommands.js';
import { getOwnPlayerContactCommand, setOwnPlayerContactCommand, getAdminPlayerContactCommand } from '../src/playerContactCommands.js';
import { registerForSeasonCommand, getOwnSeasonRegistrationCommand } from '../src/seasonRegistrationCommands.js';
import { renderProfilePage } from '../src/profilePage.js';
import { enhanceProfileContact } from '../src/profileContactEnhancer.js';
import { enhanceProfilePlayerClaim } from '../src/profilePlayerClaimEnhancer.js';
import { enhanceProfileSeasonRegistration } from '../src/profileSeasonRegistrationEnhancer.js';
import { enhanceProfileDirectMessageConsent } from '../src/profileDirectMessageConsentEnhancer.js';
import { enhanceProfileSocialChatConsent } from '../src/profileSocialChatConsentEnhancer.js';

function profileRepo(store = { displayName: 'Ada' }) {
  const repo = {
    async getProfileByUserId(userId) { return { userId, displayName: store.displayName }; },
    async saveProfile(input) { repo.last = input; return input; },
  };
  return repo;
}

function contactRepo(store = { phone: '5550101001' }) {
  const repo = {
    async getOwn(input) { return { ...input, phone: store.phone, hasPhone: Boolean(store.phone) }; },
    async setOwn(input) { repo.last = input; return input; },
    async getAdminPlayer(input) { return { ...input, phone: store.phone, displayName: 'Ada' }; },
  };
  return repo;
}

function seasonRepo() {
  return {
    async register(input) { return { ...input, registrationStatus: 'registered' }; },
    async getOwnRegistration(input) { return { ...input, participationType: 'rostered' }; },
  };
}

test('a missing actor cannot read a profile', async () => {
  await assert.rejects(() => getOwnPlayerProfileCommand({}, profileRepo()), /actorUserId is required/);
});

test('a missing repository cannot read a profile', async () => {
  await assert.rejects(() => getOwnPlayerProfileCommand({ actorUserId: 'u1' }, null), /repository is required/);
});

test('a repository without getProfileByUserId is rejected', async () => {
  await assert.rejects(
    () => getOwnPlayerProfileCommand({ actorUserId: 'u1' }, { saveProfile() {} }),
    /getProfileByUserId/,
  );
});

test('reading a profile returns what the repository stored', async () => {
  const profile = await getOwnPlayerProfileCommand({ actorUserId: 'u1' }, profileRepo({ displayName: 'Ada' }));
  assert.equal(profile.displayName, 'Ada');
  assert.equal(profile.userId, 'u1');
});

const names = [
  ['Ada', 'Ada'],
  ['  Ada  ', 'Ada'],
  ['A', 'A'],
  ['A'.repeat(80), 'A'.repeat(80)],
  ['  ' + 'B'.repeat(78) + '  ', 'B'.repeat(78)],
];
for (const [input, expected] of names) {
  test('display name ' + JSON.stringify(input).slice(0, 24) + ' saves as ' + expected.length + ' chars', async () => {
    const repo = profileRepo();
    const saved = await saveOwnPlayerProfileCommand({ actorUserId: 'u1', displayName: input }, repo);
    assert.equal(saved.displayName, expected);
    assert.equal(repo.last?.displayName, expected);
  });
}

for (const bad of ['', '   ', 'A'.repeat(81), null, undefined, 12, {}, []]) {
  test('display name ' + JSON.stringify(bad) + ' is rejected', async () => {
    await assert.rejects(
      () => saveOwnPlayerProfileCommand({ actorUserId: 'u1', displayName: bad }, profileRepo()),
      /displayName/,
    );
  });
}

test('saving a profile without an actor is rejected', async () => {
  await assert.rejects(
    () => saveOwnPlayerProfileCommand({ displayName: 'Ada' }, profileRepo()),
    /actorUserId is required/,
  );
});

for (const length of [1, 2, 10, 40, 79, 80]) {
  test('a ' + length + ' character name is kept', async () => {
    const name = 'N'.repeat(length);
    const saved = await saveOwnPlayerProfileCommand({ actorUserId: 'u1', displayName: name }, profileRepo());
    assert.equal(saved.displayName, name);
  });
}

const phones = [
  [null, null],
  ['', null],
  ['   ', null],
  ['5550101001', '5550101001'],
  ['(555) 010-1001', '(555) 010-1001'],
  ['+1 555 010 1001', '+1 555 010 1001'],
  ['1234567890', '1234567890'],
  ['123456789012345', '123456789012345'],
];
for (const [input, expected] of phones) {
  test('phone ' + JSON.stringify(input) + ' saves as ' + JSON.stringify(expected), async () => {
    const repo = contactRepo();
    const saved = await setOwnPlayerContactCommand({ actorUserId: 'u1', phone: input }, repo);
    assert.equal(saved.phone, expected);
  });
}

for (const digits of [1, 5, 9, 16, 20]) {
  test(digits + ' digits is not a usable phone', async () => {
    assert.throws(
      () => setOwnPlayerContactCommand({ actorUserId: 'u1', phone: '1'.repeat(digits) }, contactRepo()),
      /10 and 15/,
    );
  });
}

for (const bad of [12, {}, [], true]) {
  test('phone of type ' + typeof bad + ' is rejected', async () => {
    assert.throws(
      () => setOwnPlayerContactCommand({ actorUserId: 'u1', phone: bad }, contactRepo()),
      /phone must be text/,
    );
  });
}

test('reading own contact requires an actor', async () => {
  assert.throws(() => getOwnPlayerContactCommand({}, contactRepo()), /actorUserId is required/);
});

test('reading own contact requires the getOwn method', async () => {
  assert.throws(
    () => getOwnPlayerContactCommand({ actorUserId: 'u1' }, {}),
    /getOwn/,
  );
});

test('an admin contact read requires a player id', async () => {
  assert.throws(
    () => getAdminPlayerContactCommand({ actorUserId: 'admin' }, contactRepo()),
    /playerId is required/,
  );
});

test('an admin contact read returns the player the repository has', async () => {
  const contact = await getAdminPlayerContactCommand({ actorUserId: 'admin', playerId: 'p9' }, contactRepo());
  assert.equal(contact.playerId, 'p9');
  assert.equal(contact.displayName, 'Ada');
});

for (const type of ['rostered', 'free_agent']) {
  test('a player can register for a season as ' + type, async () => {
    const result = await registerForSeasonCommand(
      { actorUserId: 'u1', seasonId: 's1', participationType: type },
      seasonRepo(),
    );
    assert.equal(result.participationType, type);
    assert.equal(result.registrationStatus, 'registered');
  });
}

for (const bad of ['captain', 'guest', '', null]) {
  test('participation type ' + JSON.stringify(bad) + ' is rejected', async () => {
    await assert.rejects(
      () => registerForSeasonCommand({ actorUserId: 'u1', seasonId: 's1', participationType: bad }, seasonRepo()),
      /rostered or free_agent/,
    );
  });
}

test('season registration requires a season', async () => {
  await assert.rejects(
    () => registerForSeasonCommand({ actorUserId: 'u1' }, seasonRepo()),
    /seasonId is required/,
  );
});

test('reading a season registration requires an actor', async () => {
  await assert.rejects(
    () => getOwnSeasonRegistrationCommand({ seasonId: 's1' }, seasonRepo()),
    /actorUserId is required/,
  );
});

test('the profile page names the league and asks for a display name', () => {
  const html = renderProfilePage();
  assert.match(html, /Fremont Derby Profile/);
  assert.match(html, /Display name/);
  assert.match(html, /data-display-name/);
  assert.match(html, /data-profile-form/);
  assert.match(html, /Sign in/);
});

for (const marker of ['data-display-name-input', 'data-rating', 'data-team-body', 'data-season-body', 'data-logout', 'data-google-sign-in']) {
  test('the profile page has ' + marker, () => {
    assert.match(renderProfilePage(), new RegExp(marker));
  });
}

test('the profile page still renders when the environment is empty', () => {
  const html = renderProfilePage({});
  assert.match(html, /<html lang="en">/);
  assert.match(html, /Profile/);
});

async function pageResponse() {
  return new Response('<html><body><section class="stack" data-authenticated-content hidden></section></body></html>', {
    headers: { 'content-type': 'text/html' },
  });
}

const enhancers = [
  ['contact', enhanceProfileContact, 'data-profile-contact'],
  ['claim', enhanceProfilePlayerClaim, 'data-player-claim'],
  ['season', enhanceProfileSeasonRegistration, 'data-season-now'],
  ['direct message consent', enhanceProfileDirectMessageConsent, 'data-dm-consent'],
  ['social chat consent', enhanceProfileSocialChatConsent, 'data-social-'],
];
for (const [label, enhance, marker] of enhancers) {
  test('the ' + label + ' section is added to a profile page', async () => {
    const response = await enhance(await pageResponse());
    const html = await response.text();
    assert.match(html, new RegExp(marker));
  });
  test('the ' + label + ' section is not added to a non-html response', async () => {
    const response = await enhance(new Response('{}', { headers: { 'content-type': 'application/json' } }));
    assert.equal(await response.text(), '{}');
  });
}

for (const userId of ['u1', 'player-9', '00000000-0000-0000-0000-000000000001']) {
  test('profile read keeps the actor id ' + userId, async () => {
    const profile = await getOwnPlayerProfileCommand({ actorUserId: userId }, profileRepo());
    assert.equal(profile.userId, userId);
  });
}

for (const playerId of ['p1', 'player-2', 'claim-me']) {
  test('admin contact read keeps the player id ' + playerId, async () => {
    const contact = await getAdminPlayerContactCommand({ actorUserId: 'admin', playerId }, contactRepo());
    assert.equal(contact.playerId, playerId);
  });
}
