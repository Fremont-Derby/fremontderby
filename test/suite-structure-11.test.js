import test from 'node:test';
import assert from 'node:assert/strict';

test('profileDirectMessageConsentEnhancer.js loads and exports its named members', async () => {
  const mod = await import('../src/profileDirectMessageConsentEnhancer.js');
  const expected = ["enhanceProfileDirectMessageConsent"];
  for (const name of expected) {
    assert.ok(name in mod, 'profileDirectMessageConsentEnhancer.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('profilePage.js loads and exports its named members', async () => {
  const mod = await import('../src/profilePage.js');
  const expected = ["renderProfilePage"];
  for (const name of expected) {
    assert.ok(name in mod, 'profilePage.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('profilePlayerClaimEnhancer.js loads and exports its named members', async () => {
  const mod = await import('../src/profilePlayerClaimEnhancer.js');
  const expected = ["enhanceProfilePlayerClaim"];
  for (const name of expected) {
    assert.ok(name in mod, 'profilePlayerClaimEnhancer.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('profileSeasonRegistrationEnhancer.js loads and exports its named members', async () => {
  const mod = await import('../src/profileSeasonRegistrationEnhancer.js');
  const expected = ["enhanceProfileSeasonRegistration"];
  for (const name of expected) {
    assert.ok(name in mod, 'profileSeasonRegistrationEnhancer.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('profileSocialChatConsentEnhancer.js loads and exports its named members', async () => {
  const mod = await import('../src/profileSocialChatConsentEnhancer.js');
  const expected = ["enhanceProfileSocialChatConsent"];
  for (const name of expected) {
    assert.ok(name in mod, 'profileSocialChatConsentEnhancer.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('publicPages.js loads and exports its named members', async () => {
  const mod = await import('../src/publicPages.js');
  const expected = ["renderIntroPage","renderRulesPage"];
  for (const name of expected) {
    assert.ok(name in mod, 'publicPages.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('publicSeasonSelection.js loads and exports its named members', async () => {
  const mod = await import('../src/publicSeasonSelection.js');
  const expected = ["choosePublicSeason","publicSeasonSelectionBrowserSource"];
  for (const name of expected) {
    assert.ok(name in mod, 'publicSeasonSelection.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('publicSeasonSelectionEnhancer.js loads and exports its named members', async () => {
  const mod = await import('../src/publicSeasonSelectionEnhancer.js');
  const expected = ["enhancePublicSeasonSelection"];
  for (const name of expected) {
    assert.ok(name in mod, 'publicSeasonSelectionEnhancer.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('publicSurfaceTheme.js loads and exports its named members', async () => {
  const mod = await import('../src/publicSurfaceTheme.js');
  const expected = ["publicSurfaceThemeStyles","injectPublicSurfaceTheme"];
  for (const name of expected) {
    assert.ok(name in mod, 'publicSurfaceTheme.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('qaCaptainAddPlayersMission.js loads and exports its named members', async () => {
  const mod = await import('../src/qaCaptainAddPlayersMission.js');
  const expected = ["buildCaptainAddPlayersFixture","activeCaptainAddPlayersMission","routeQaCaptainAddPlayersMission","enhanceQaCaptainAddPlayersMission"];
  for (const name of expected) {
    assert.ok(name in mod, 'qaCaptainAddPlayersMission.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
