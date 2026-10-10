import test from 'node:test';
import assert from 'node:assert/strict';

test('dualScoringCommands.js exports confirmPlayerMatchScoreCommand as a function', async () => {
  const mod = await import('../src/dualScoringCommands.js');
  assert.equal(typeof mod.confirmPlayerMatchScoreCommand, 'function');
});
test('dualScoringCommands.js exports finalizeReconciledPlayerMatchCommand as a function', async () => {
  const mod = await import('../src/dualScoringCommands.js');
  assert.equal(typeof mod.finalizeReconciledPlayerMatchCommand, 'function');
});
test('dualScoringCommands.js exports adminOverrideReconciledPlayerMatchCommand as a function', async () => {
  const mod = await import('../src/dualScoringCommands.js');
  assert.equal(typeof mod.adminOverrideReconciledPlayerMatchCommand, 'function');
});
test('freeAgentCommands.js exports registerFreeAgentCommand as a function', async () => {
  const mod = await import('../src/freeAgentCommands.js');
  assert.equal(typeof mod.registerFreeAgentCommand, 'function');
});
test('freeAgentCommands.js exports setFreeAgentAvailabilityCommand as a function', async () => {
  const mod = await import('../src/freeAgentCommands.js');
  assert.equal(typeof mod.setFreeAgentAvailabilityCommand, 'function');
});
test('freeAgentCommands.js exports listEligibleFreeAgentsCommand as a function', async () => {
  const mod = await import('../src/freeAgentCommands.js');
  assert.equal(typeof mod.listEligibleFreeAgentsCommand, 'function');
});
test('lineupCommands.js exports submitTeamLineupCommand as a function', async () => {
  const mod = await import('../src/lineupCommands.js');
  assert.equal(typeof mod.submitTeamLineupCommand, 'function');
});
test('lineupCommands.js exports listVisibleTeamLineupsCommand as a function', async () => {
  const mod = await import('../src/lineupCommands.js');
  assert.equal(typeof mod.listVisibleTeamLineupsCommand, 'function');
});
test('playerProfileCommands.js exports getOwnPlayerProfileCommand as a function', async () => {
  const mod = await import('../src/playerProfileCommands.js');
  assert.equal(typeof mod.getOwnPlayerProfileCommand, 'function');
});
test('playerProfileCommands.js exports saveOwnPlayerProfileCommand as a function', async () => {
  const mod = await import('../src/playerProfileCommands.js');
  assert.equal(typeof mod.saveOwnPlayerProfileCommand, 'function');
});
test('playoffCommands.js exports startSeasonPlayoffsCommand as a function', async () => {
  const mod = await import('../src/playoffCommands.js');
  assert.equal(typeof mod.startSeasonPlayoffsCommand, 'function');
});
test('playoffCommands.js exports advanceSeasonToChampionshipCommand as a function', async () => {
  const mod = await import('../src/playoffCommands.js');
  assert.equal(typeof mod.advanceSeasonToChampionshipCommand, 'function');
});
