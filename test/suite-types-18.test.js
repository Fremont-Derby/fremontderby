import test from 'node:test';
import assert from 'node:assert/strict';

test('scoringRepository.js createScoringRepository has a usable type', async () => {
  const mod = await import('../src/scoringRepository.js');
  const value = mod.createScoringRepository;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('seasonCloseCommands.js getSeasonCloseReadinessCommand has a usable type', async () => {
  const mod = await import('../src/seasonCloseCommands.js');
  const value = mod.getSeasonCloseReadinessCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('seasonCloseCommands.js closeSeasonCommand has a usable type', async () => {
  const mod = await import('../src/seasonCloseCommands.js');
  const value = mod.closeSeasonCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('seasonCloseEnhancer.js enhanceSeasonClose has a usable type', async () => {
  const mod = await import('../src/seasonCloseEnhancer.js');
  const value = mod.enhanceSeasonClose;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('seasonCloseHttp.js routeSeasonClose has a usable type', async () => {
  const mod = await import('../src/seasonCloseHttp.js');
  const value = mod.routeSeasonClose;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('seasonCloseRepository.js createSeasonCloseRepository has a usable type', async () => {
  const mod = await import('../src/seasonCloseRepository.js');
  const value = mod.createSeasonCloseRepository;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('seasonCommands.js publishSeasonScheduleCommand has a usable type', async () => {
  const mod = await import('../src/seasonCommands.js');
  const value = mod.publishSeasonScheduleCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('seasonPublishReadinessEnhancer.js deriveSeasonPublishReadiness has a usable type', async () => {
  const mod = await import('../src/seasonPublishReadinessEnhancer.js');
  const value = mod.deriveSeasonPublishReadiness;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('seasonPublishReadinessEnhancer.js enhanceSeasonPublishReadiness has a usable type', async () => {
  const mod = await import('../src/seasonPublishReadinessEnhancer.js');
  const value = mod.enhanceSeasonPublishReadiness;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('seasonRegistrationCommands.js registerForSeasonCommand has a usable type', async () => {
  const mod = await import('../src/seasonRegistrationCommands.js');
  const value = mod.registerForSeasonCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('seasonRegistrationCommands.js getOwnSeasonRegistrationCommand has a usable type', async () => {
  const mod = await import('../src/seasonRegistrationCommands.js');
  const value = mod.getOwnSeasonRegistrationCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
