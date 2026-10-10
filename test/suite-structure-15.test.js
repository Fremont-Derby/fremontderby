import test from 'node:test';
import assert from 'node:assert/strict';

test('seasonCloseHttp.js loads and exports its named members', async () => {
  const mod = await import('../src/seasonCloseHttp.js');
  const expected = ["routeSeasonClose"];
  for (const name of expected) {
    assert.ok(name in mod, 'seasonCloseHttp.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('seasonCloseHttp.js exports routeSeasonClose as a defined value', async () => {
  const mod = await import('../src/seasonCloseHttp.js');
  assert.notEqual(mod.routeSeasonClose, undefined, 'routeSeasonClose is missing');
});
test('seasonCloseRepository.js loads and exports its named members', async () => {
  const mod = await import('../src/seasonCloseRepository.js');
  const expected = ["createSeasonCloseRepository"];
  for (const name of expected) {
    assert.ok(name in mod, 'seasonCloseRepository.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('seasonCloseRepository.js exports createSeasonCloseRepository as a defined value', async () => {
  const mod = await import('../src/seasonCloseRepository.js');
  assert.notEqual(mod.createSeasonCloseRepository, undefined, 'createSeasonCloseRepository is missing');
});
test('seasonCommands.js loads and exports its named members', async () => {
  const mod = await import('../src/seasonCommands.js');
  const expected = ["publishSeasonScheduleCommand"];
  for (const name of expected) {
    assert.ok(name in mod, 'seasonCommands.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('seasonCommands.js exports publishSeasonScheduleCommand as a defined value', async () => {
  const mod = await import('../src/seasonCommands.js');
  assert.notEqual(mod.publishSeasonScheduleCommand, undefined, 'publishSeasonScheduleCommand is missing');
});
test('seasonPublishReadinessEnhancer.js loads and exports its named members', async () => {
  const mod = await import('../src/seasonPublishReadinessEnhancer.js');
  const expected = ["deriveSeasonPublishReadiness","enhanceSeasonPublishReadiness"];
  for (const name of expected) {
    assert.ok(name in mod, 'seasonPublishReadinessEnhancer.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('seasonPublishReadinessEnhancer.js exports deriveSeasonPublishReadiness as a defined value', async () => {
  const mod = await import('../src/seasonPublishReadinessEnhancer.js');
  assert.notEqual(mod.deriveSeasonPublishReadiness, undefined, 'deriveSeasonPublishReadiness is missing');
});
test('seasonPublishReadinessEnhancer.js exports enhanceSeasonPublishReadiness as a defined value', async () => {
  const mod = await import('../src/seasonPublishReadinessEnhancer.js');
  assert.notEqual(mod.enhanceSeasonPublishReadiness, undefined, 'enhanceSeasonPublishReadiness is missing');
});
test('seasonRegistrationCommands.js loads and exports its named members', async () => {
  const mod = await import('../src/seasonRegistrationCommands.js');
  const expected = ["registerForSeasonCommand","getOwnSeasonRegistrationCommand"];
  for (const name of expected) {
    assert.ok(name in mod, 'seasonRegistrationCommands.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('seasonRegistrationCommands.js exports registerForSeasonCommand as a defined value', async () => {
  const mod = await import('../src/seasonRegistrationCommands.js');
  assert.notEqual(mod.registerForSeasonCommand, undefined, 'registerForSeasonCommand is missing');
});
test('seasonRegistrationCommands.js exports getOwnSeasonRegistrationCommand as a defined value', async () => {
  const mod = await import('../src/seasonRegistrationCommands.js');
  assert.notEqual(mod.getOwnSeasonRegistrationCommand, undefined, 'getOwnSeasonRegistrationCommand is missing');
});
test('seasonRegistrationRepository.js loads and exports its named members', async () => {
  const mod = await import('../src/seasonRegistrationRepository.js');
  const expected = ["createSeasonRegistrationRepository"];
  for (const name of expected) {
    assert.ok(name in mod, 'seasonRegistrationRepository.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('seasonRegistrationRepository.js exports createSeasonRegistrationRepository as a defined value', async () => {
  const mod = await import('../src/seasonRegistrationRepository.js');
  assert.notEqual(mod.createSeasonRegistrationRepository, undefined, 'createSeasonRegistrationRepository is missing');
});
test('seasonSetupCommands.js loads and exports its named members', async () => {
  const mod = await import('../src/seasonSetupCommands.js');
  const expected = ["getSeasonSetupCommand","saveSeasonSetupCommand"];
  for (const name of expected) {
    assert.ok(name in mod, 'seasonSetupCommands.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('seasonSetupCommands.js exports getSeasonSetupCommand as a defined value', async () => {
  const mod = await import('../src/seasonSetupCommands.js');
  assert.notEqual(mod.getSeasonSetupCommand, undefined, 'getSeasonSetupCommand is missing');
});
test('seasonSetupCommands.js exports saveSeasonSetupCommand as a defined value', async () => {
  const mod = await import('../src/seasonSetupCommands.js');
  assert.notEqual(mod.saveSeasonSetupCommand, undefined, 'saveSeasonSetupCommand is missing');
});
test('seasonSetupPage.js loads and exports its named members', async () => {
  const mod = await import('../src/seasonSetupPage.js');
  const expected = ["renderSeasonSetupPage"];
  for (const name of expected) {
    assert.ok(name in mod, 'seasonSetupPage.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('seasonSetupPage.js exports renderSeasonSetupPage as a defined value', async () => {
  const mod = await import('../src/seasonSetupPage.js');
  assert.notEqual(mod.renderSeasonSetupPage, undefined, 'renderSeasonSetupPage is missing');
});
test('siteStyles.js loads and exports its named members', async () => {
  const mod = await import('../src/siteStyles.js');
  const expected = ["siteStyles","injectSiteStyles"];
  for (const name of expected) {
    assert.ok(name in mod, 'siteStyles.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('siteStyles.js exports siteStyles as a defined value', async () => {
  const mod = await import('../src/siteStyles.js');
  assert.notEqual(mod.siteStyles, undefined, 'siteStyles is missing');
});
test('siteStyles.js exports injectSiteStyles as a defined value', async () => {
  const mod = await import('../src/siteStyles.js');
  assert.notEqual(mod.injectSiteStyles, undefined, 'injectSiteStyles is missing');
});
test('socialChatConsentHttp.js loads and exports its named members', async () => {
  const mod = await import('../src/socialChatConsentHttp.js');
  const expected = ["routeSocialChatConsent"];
  for (const name of expected) {
    assert.ok(name in mod, 'socialChatConsentHttp.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('socialChatConsentHttp.js exports routeSocialChatConsent as a defined value', async () => {
  const mod = await import('../src/socialChatConsentHttp.js');
  assert.notEqual(mod.routeSocialChatConsent, undefined, 'routeSocialChatConsent is missing');
});
