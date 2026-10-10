import test from 'node:test';
import assert from 'node:assert/strict';

test('seasonRegistrationRepository.js createSeasonRegistrationRepository has a usable type', async () => {
  const mod = await import('../src/seasonRegistrationRepository.js');
  const value = mod.createSeasonRegistrationRepository;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('seasonSetupCommands.js getSeasonSetupCommand has a usable type', async () => {
  const mod = await import('../src/seasonSetupCommands.js');
  const value = mod.getSeasonSetupCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('seasonSetupCommands.js saveSeasonSetupCommand has a usable type', async () => {
  const mod = await import('../src/seasonSetupCommands.js');
  const value = mod.saveSeasonSetupCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('seasonSetupPage.js renderSeasonSetupPage has a usable type', async () => {
  const mod = await import('../src/seasonSetupPage.js');
  const value = mod.renderSeasonSetupPage;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('siteStyles.js siteStyles has a usable type', async () => {
  const mod = await import('../src/siteStyles.js');
  const value = mod.siteStyles;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('siteStyles.js injectSiteStyles has a usable type', async () => {
  const mod = await import('../src/siteStyles.js');
  const value = mod.injectSiteStyles;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('socialChatConsentHttp.js routeSocialChatConsent has a usable type', async () => {
  const mod = await import('../src/socialChatConsentHttp.js');
  const value = mod.routeSocialChatConsent;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('standingsCommands.js listTeamStandingsCommand has a usable type', async () => {
  const mod = await import('../src/standingsCommands.js');
  const value = mod.listTeamStandingsCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('standingsCommands.js listIndividualStandingsCommand has a usable type', async () => {
  const mod = await import('../src/standingsCommands.js');
  const value = mod.listIndividualStandingsCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('standingsPage.js renderStandingsPage has a usable type', async () => {
  const mod = await import('../src/standingsPage.js');
  const value = mod.renderStandingsPage;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('standingsRepository.js createStandingsRepository has a usable type', async () => {
  const mod = await import('../src/standingsRepository.js');
  const value = mod.createStandingsRepository;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
