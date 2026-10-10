import test from 'node:test';
import assert from 'node:assert/strict';
import { saveOwnPlayerProfileCommand, getOwnPlayerProfileCommand } from '../src/playerProfileCommands.js';
import { setOwnPlayerContactCommand, getOwnPlayerContactCommand } from '../src/playerContactCommands.js';
import { renderProfilePage } from '../src/profilePage.js';
import { enhanceProfileContact } from '../src/profileContactEnhancer.js';
import { enhanceProfilePlayerClaim } from '../src/profilePlayerClaimEnhancer.js';
import { enhanceProfileSeasonRegistration } from '../src/profileSeasonRegistrationEnhancer.js';
import { enhanceProfileDirectMessageConsent } from '../src/profileDirectMessageConsentEnhancer.js';
import { enhanceProfileSocialChatConsent } from '../src/profileSocialChatConsentEnhancer.js';

function profileRepo() {
  const repo = {
    async getProfileByUserId(userId) { return { userId, displayName: repo.savedName || 'unset' }; },
    async saveProfile(input) { repo.savedName = input.displayName; return input; },
  };
  return repo;
}
function contactRepo() {
  return {
    async getOwn(input) { return input; },
    async setOwn(input) { return input; },
  };
}

const blanks = ['\t Ada', 'Ada\n', ' Ada ', '  Ada', ' Ada', 'Ada '];
for (const value of blanks) {
  test('profile normalizes whitespace name ' + JSON.stringify(value), async () => {
    const saved = await saveOwnPlayerProfileCommand({ actorUserId: 'u1', displayName: value }, profileRepo());
    assert.equal(saved.displayName, value.trim());
    assert.ok(saved.displayName.length > 0);
  });
}

const onlyBlank = ['', ' ', '   ', '\t', '\n', '\t\n '];
for (const value of onlyBlank) {
  test('profile rejects a blank name ' + JSON.stringify(value), async () => {
    await assert.rejects(
      () => saveOwnPlayerProfileCommand({ actorUserId: 'u1', displayName: value }, profileRepo()),
      /displayName is required/,
    );
  });
}

const clearing = [null, '', '   '];
for (const phone of clearing) {
  test('clearing a phone with ' + JSON.stringify(phone) + ' stores null', async () => {
    const saved = await setOwnPlayerContactCommand({ actorUserId: 'u1', phone }, contactRepo());
    assert.equal(saved.phone, null);
  });
}

for (let n = 10; n <= 15; n += 1) {
  test('phone with ' + n + ' digits and dashes is kept', async () => {
    const phone = '5'.repeat(n - 4) + '-0101';
    const saved = await setOwnPlayerContactCommand({ actorUserId: 'u1', phone }, contactRepo());
    assert.equal(saved.phone, phone);
  });
}

for (const actor of ['', null, undefined, 0, false]) {
  test('profile save rejects actor ' + JSON.stringify(actor), async () => {
    await assert.rejects(
      () => saveOwnPlayerProfileCommand({ actorUserId: actor, displayName: 'Ada' }, profileRepo()),
      /actorUserId is required/,
    );
  });
  test('profile read rejects actor ' + JSON.stringify(actor), async () => {
    await assert.rejects(
      () => getOwnPlayerProfileCommand({ actorUserId: actor }, profileRepo()),
      /actorUserId is required/,
    );
  });
  test('contact read rejects actor ' + JSON.stringify(actor), async () => {
    assert.throws(
      () => getOwnPlayerContactCommand({ actorUserId: actor }, contactRepo()),
      /actorUserId is required/,
    );
  });
}

const markers = {
  contact: ['data-profile-contact', 'data-contact-phone', 'data-contact-save', 'data-contact-form'],
  claim: ['data-player-claim', 'data-player-claim-query', 'data-player-claim-results', 'data-player-claim-search'],
  season: ['data-season-now', 'data-season-now-name', 'data-season-now-action', 'data-profile-season-status'],
  dm: ['data-dm-consent', 'data-dm-consent-toggle', 'data-dm-consent-save'],
  social: ['data-social-general-consent-form'],
};
const enhancers = {
  contact: enhanceProfileContact,
  claim: enhanceProfilePlayerClaim,
  season: enhanceProfileSeasonRegistration,
  dm: enhanceProfileDirectMessageConsent,
  social: enhanceProfileSocialChatConsent,
};
function page() {
  return new Response('<html><body><section class="stack" data-authenticated-content hidden></section></body></html>', {
    headers: { 'content-type': 'text/html' },
  });
}
for (const [name, list] of Object.entries(markers)) {
  for (const marker of list) {
    test('profile ' + name + ' section includes ' + marker, async () => {
      const response = await enhancers[name](page());
      const html = await response.text();
      assert.ok(html.includes(marker), marker);
    });
  }
}

const envCases = [
  {},
  { SUPABASE_URL: '' },
  { SUPABASE_URL: 'https://abc.supabase.co' },
  { SUPABASE_PUBLISHABLE_KEY: 'publishable' },
  { SUPABASE_URL: 'https://abc.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'publishable' },
];
for (const env of envCases) {
  test('profile page renders with env ' + JSON.stringify(env), () => {
    const html = renderProfilePage(env);
    assert.match(html, /Fremont Derby Profile/);
    assert.match(html, /data-profile-form/);
    assert.match(html, /<html lang="en">/);
  });
}

for (const name of ['A B', 'First Last', 'Three Name Person', 'X Y Z Q']) {
  test('profile keeps a multi-word name ' + name, async () => {
    const saved = await saveOwnPlayerProfileCommand({ actorUserId: 'u1', displayName: name }, profileRepo());
    assert.equal(saved.displayName, name);
  });
}
