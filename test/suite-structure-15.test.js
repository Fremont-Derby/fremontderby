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
test('seasonCloseRepository.js loads and exports its named members', async () => {
  const mod = await import('../src/seasonCloseRepository.js');
  const expected = ["createSeasonCloseRepository"];
  for (const name of expected) {
    assert.ok(name in mod, 'seasonCloseRepository.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('seasonCommands.js loads and exports its named members', async () => {
  const mod = await import('../src/seasonCommands.js');
  const expected = ["publishSeasonScheduleCommand"];
  for (const name of expected) {
    assert.ok(name in mod, 'seasonCommands.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('seasonPublishReadinessEnhancer.js loads and exports its named members', async () => {
  const mod = await import('../src/seasonPublishReadinessEnhancer.js');
  const expected = ["deriveSeasonPublishReadiness","enhanceSeasonPublishReadiness"];
  for (const name of expected) {
    assert.ok(name in mod, 'seasonPublishReadinessEnhancer.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('seasonRegistrationCommands.js loads and exports its named members', async () => {
  const mod = await import('../src/seasonRegistrationCommands.js');
  const expected = ["registerForSeasonCommand","getOwnSeasonRegistrationCommand"];
  for (const name of expected) {
    assert.ok(name in mod, 'seasonRegistrationCommands.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('seasonRegistrationRepository.js loads and exports its named members', async () => {
  const mod = await import('../src/seasonRegistrationRepository.js');
  const expected = ["createSeasonRegistrationRepository"];
  for (const name of expected) {
    assert.ok(name in mod, 'seasonRegistrationRepository.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('seasonSetupCommands.js loads and exports its named members', async () => {
  const mod = await import('../src/seasonSetupCommands.js');
  const expected = ["getSeasonSetupCommand","saveSeasonSetupCommand"];
  for (const name of expected) {
    assert.ok(name in mod, 'seasonSetupCommands.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('seasonSetupPage.js loads and exports its named members', async () => {
  const mod = await import('../src/seasonSetupPage.js');
  const expected = ["renderSeasonSetupPage"];
  for (const name of expected) {
    assert.ok(name in mod, 'seasonSetupPage.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('siteStyles.js loads and exports its named members', async () => {
  const mod = await import('../src/siteStyles.js');
  const expected = ["siteStyles","injectSiteStyles"];
  for (const name of expected) {
    assert.ok(name in mod, 'siteStyles.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('socialChatConsentHttp.js loads and exports its named members', async () => {
  const mod = await import('../src/socialChatConsentHttp.js');
  const expected = ["routeSocialChatConsent"];
  for (const name of expected) {
    assert.ok(name in mod, 'socialChatConsentHttp.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
