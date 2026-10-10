import test from 'node:test';
import assert from 'node:assert/strict';

test('seasonCloseCommands.js exports getSeasonCloseReadinessCommand as a function', async () => {
  const mod = await import('../src/seasonCloseCommands.js');
  assert.equal(typeof mod.getSeasonCloseReadinessCommand, 'function');
});
test('seasonCloseCommands.js exports closeSeasonCommand as a function', async () => {
  const mod = await import('../src/seasonCloseCommands.js');
  assert.equal(typeof mod.closeSeasonCommand, 'function');
});
test('seasonCommands.js exports publishSeasonScheduleCommand as a function', async () => {
  const mod = await import('../src/seasonCommands.js');
  assert.equal(typeof mod.publishSeasonScheduleCommand, 'function');
});
test('seasonRegistrationCommands.js exports registerForSeasonCommand as a function', async () => {
  const mod = await import('../src/seasonRegistrationCommands.js');
  assert.equal(typeof mod.registerForSeasonCommand, 'function');
});
test('seasonRegistrationCommands.js exports getOwnSeasonRegistrationCommand as a function', async () => {
  const mod = await import('../src/seasonRegistrationCommands.js');
  assert.equal(typeof mod.getOwnSeasonRegistrationCommand, 'function');
});
test('seasonSetupCommands.js exports getSeasonSetupCommand as a function', async () => {
  const mod = await import('../src/seasonSetupCommands.js');
  assert.equal(typeof mod.getSeasonSetupCommand, 'function');
});
test('seasonSetupCommands.js exports saveSeasonSetupCommand as a function', async () => {
  const mod = await import('../src/seasonSetupCommands.js');
  assert.equal(typeof mod.saveSeasonSetupCommand, 'function');
});
test('standingsCommands.js exports listTeamStandingsCommand as a function', async () => {
  const mod = await import('../src/standingsCommands.js');
  assert.equal(typeof mod.listTeamStandingsCommand, 'function');
});
test('standingsCommands.js exports listIndividualStandingsCommand as a function', async () => {
  const mod = await import('../src/standingsCommands.js');
  assert.equal(typeof mod.listIndividualStandingsCommand, 'function');
});
test('teamCommands.js exports listOwnTeamManagementCommand as a function', async () => {
  const mod = await import('../src/teamCommands.js');
  assert.equal(typeof mod.listOwnTeamManagementCommand, 'function');
});
test('teamCommands.js exports listOwnTeamTradesCommand as a function', async () => {
  const mod = await import('../src/teamCommands.js');
  assert.equal(typeof mod.listOwnTeamTradesCommand, 'function');
});
test('teamCommands.js exports createTeamWithCaptainCommand as a function', async () => {
  const mod = await import('../src/teamCommands.js');
  assert.equal(typeof mod.createTeamWithCaptainCommand, 'function');
});
