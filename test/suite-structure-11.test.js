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
test('profileDirectMessageConsentEnhancer.js exports enhanceProfileDirectMessageConsent as a defined value', async () => {
  const mod = await import('../src/profileDirectMessageConsentEnhancer.js');
  assert.notEqual(mod.enhanceProfileDirectMessageConsent, undefined, 'enhanceProfileDirectMessageConsent is missing');
});
test('profilePage.js loads and exports its named members', async () => {
  const mod = await import('../src/profilePage.js');
  const expected = ["renderProfilePage"];
  for (const name of expected) {
    assert.ok(name in mod, 'profilePage.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('profilePage.js exports renderProfilePage as a defined value', async () => {
  const mod = await import('../src/profilePage.js');
  assert.notEqual(mod.renderProfilePage, undefined, 'renderProfilePage is missing');
});
test('profilePlayerClaimEnhancer.js loads and exports its named members', async () => {
  const mod = await import('../src/profilePlayerClaimEnhancer.js');
  const expected = ["enhanceProfilePlayerClaim"];
  for (const name of expected) {
    assert.ok(name in mod, 'profilePlayerClaimEnhancer.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('profilePlayerClaimEnhancer.js exports enhanceProfilePlayerClaim as a defined value', async () => {
  const mod = await import('../src/profilePlayerClaimEnhancer.js');
  assert.notEqual(mod.enhanceProfilePlayerClaim, undefined, 'enhanceProfilePlayerClaim is missing');
});
test('profileSeasonRegistrationEnhancer.js loads and exports its named members', async () => {
  const mod = await import('../src/profileSeasonRegistrationEnhancer.js');
  const expected = ["enhanceProfileSeasonRegistration"];
  for (const name of expected) {
    assert.ok(name in mod, 'profileSeasonRegistrationEnhancer.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('profileSeasonRegistrationEnhancer.js exports enhanceProfileSeasonRegistration as a defined value', async () => {
  const mod = await import('../src/profileSeasonRegistrationEnhancer.js');
  assert.notEqual(mod.enhanceProfileSeasonRegistration, undefined, 'enhanceProfileSeasonRegistration is missing');
});
test('profileSocialChatConsentEnhancer.js loads and exports its named members', async () => {
  const mod = await import('../src/profileSocialChatConsentEnhancer.js');
  const expected = ["enhanceProfileSocialChatConsent"];
  for (const name of expected) {
    assert.ok(name in mod, 'profileSocialChatConsentEnhancer.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('profileSocialChatConsentEnhancer.js exports enhanceProfileSocialChatConsent as a defined value', async () => {
  const mod = await import('../src/profileSocialChatConsentEnhancer.js');
  assert.notEqual(mod.enhanceProfileSocialChatConsent, undefined, 'enhanceProfileSocialChatConsent is missing');
});
test('publicPages.js loads and exports its named members', async () => {
  const mod = await import('../src/publicPages.js');
  const expected = ["renderIntroPage","renderRulesPage"];
  for (const name of expected) {
    assert.ok(name in mod, 'publicPages.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('publicPages.js exports renderIntroPage as a defined value', async () => {
  const mod = await import('../src/publicPages.js');
  assert.notEqual(mod.renderIntroPage, undefined, 'renderIntroPage is missing');
});
test('publicPages.js exports renderRulesPage as a defined value', async () => {
  const mod = await import('../src/publicPages.js');
  assert.notEqual(mod.renderRulesPage, undefined, 'renderRulesPage is missing');
});
test('publicSeasonSelection.js loads and exports its named members', async () => {
  const mod = await import('../src/publicSeasonSelection.js');
  const expected = ["choosePublicSeason","publicSeasonSelectionBrowserSource"];
  for (const name of expected) {
    assert.ok(name in mod, 'publicSeasonSelection.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('publicSeasonSelection.js exports choosePublicSeason as a defined value', async () => {
  const mod = await import('../src/publicSeasonSelection.js');
  assert.notEqual(mod.choosePublicSeason, undefined, 'choosePublicSeason is missing');
});
test('publicSeasonSelection.js exports publicSeasonSelectionBrowserSource as a defined value', async () => {
  const mod = await import('../src/publicSeasonSelection.js');
  assert.notEqual(mod.publicSeasonSelectionBrowserSource, undefined, 'publicSeasonSelectionBrowserSource is missing');
});
test('publicSeasonSelectionEnhancer.js loads and exports its named members', async () => {
  const mod = await import('../src/publicSeasonSelectionEnhancer.js');
  const expected = ["enhancePublicSeasonSelection"];
  for (const name of expected) {
    assert.ok(name in mod, 'publicSeasonSelectionEnhancer.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('publicSeasonSelectionEnhancer.js exports enhancePublicSeasonSelection as a defined value', async () => {
  const mod = await import('../src/publicSeasonSelectionEnhancer.js');
  assert.notEqual(mod.enhancePublicSeasonSelection, undefined, 'enhancePublicSeasonSelection is missing');
});
test('publicSurfaceTheme.js loads and exports its named members', async () => {
  const mod = await import('../src/publicSurfaceTheme.js');
  const expected = ["publicSurfaceThemeStyles","injectPublicSurfaceTheme"];
  for (const name of expected) {
    assert.ok(name in mod, 'publicSurfaceTheme.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('publicSurfaceTheme.js exports publicSurfaceThemeStyles as a defined value', async () => {
  const mod = await import('../src/publicSurfaceTheme.js');
  assert.notEqual(mod.publicSurfaceThemeStyles, undefined, 'publicSurfaceThemeStyles is missing');
});
test('publicSurfaceTheme.js exports injectPublicSurfaceTheme as a defined value', async () => {
  const mod = await import('../src/publicSurfaceTheme.js');
  assert.notEqual(mod.injectPublicSurfaceTheme, undefined, 'injectPublicSurfaceTheme is missing');
});
test('qaCaptainAddPlayersMission.js loads and exports its named members', async () => {
  const mod = await import('../src/qaCaptainAddPlayersMission.js');
  const expected = ["buildCaptainAddPlayersFixture","activeCaptainAddPlayersMission","routeQaCaptainAddPlayersMission","enhanceQaCaptainAddPlayersMission"];
  for (const name of expected) {
    assert.ok(name in mod, 'qaCaptainAddPlayersMission.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('qaCaptainAddPlayersMission.js exports buildCaptainAddPlayersFixture as a defined value', async () => {
  const mod = await import('../src/qaCaptainAddPlayersMission.js');
  assert.notEqual(mod.buildCaptainAddPlayersFixture, undefined, 'buildCaptainAddPlayersFixture is missing');
});
test('qaCaptainAddPlayersMission.js exports activeCaptainAddPlayersMission as a defined value', async () => {
  const mod = await import('../src/qaCaptainAddPlayersMission.js');
  assert.notEqual(mod.activeCaptainAddPlayersMission, undefined, 'activeCaptainAddPlayersMission is missing');
});
test('qaCaptainAddPlayersMission.js exports routeQaCaptainAddPlayersMission as a defined value', async () => {
  const mod = await import('../src/qaCaptainAddPlayersMission.js');
  assert.notEqual(mod.routeQaCaptainAddPlayersMission, undefined, 'routeQaCaptainAddPlayersMission is missing');
});
test('qaCaptainAddPlayersMission.js exports enhanceQaCaptainAddPlayersMission as a defined value', async () => {
  const mod = await import('../src/qaCaptainAddPlayersMission.js');
  assert.notEqual(mod.enhanceQaCaptainAddPlayersMission, undefined, 'enhanceQaCaptainAddPlayersMission is missing');
});
