import test from 'node:test';
import assert from 'node:assert/strict';

test('playoffCommands.js exports submitPostseasonLineupCommand as a function', async () => {
  const mod = await import('../src/playoffCommands.js');
  assert.equal(typeof mod.submitPostseasonLineupCommand, 'function');
});
test('prizeCommands.js exports getSeasonPrizeSummaryCommand as a function', async () => {
  const mod = await import('../src/prizeCommands.js');
  assert.equal(typeof mod.getSeasonPrizeSummaryCommand, 'function');
});
test('prizeCommands.js exports configureSeasonPrizesCommand as a function', async () => {
  const mod = await import('../src/prizeCommands.js');
  assert.equal(typeof mod.configureSeasonPrizesCommand, 'function');
});
test('prizeCommands.js exports finalizeSeasonPrizePayoutsCommand as a function', async () => {
  const mod = await import('../src/prizeCommands.js');
  assert.equal(typeof mod.finalizeSeasonPrizePayoutsCommand, 'function');
});
test('sandboxFeedbackCommands.js exports submitSandboxFeedbackCommand as a function', async () => {
  const mod = await import('../src/sandboxFeedbackCommands.js');
  assert.equal(typeof mod.submitSandboxFeedbackCommand, 'function');
});
test('sandboxFeedbackCommands.js exports listSandboxFeedbackCommand as a function', async () => {
  const mod = await import('../src/sandboxFeedbackCommands.js');
  assert.equal(typeof mod.listSandboxFeedbackCommand, 'function');
});
test('sandboxFeedbackCommands.js exports resolveSandboxFeedbackCommand as a function', async () => {
  const mod = await import('../src/sandboxFeedbackCommands.js');
  assert.equal(typeof mod.resolveSandboxFeedbackCommand, 'function');
});
test('scoringCommands.js exports getPlayerMatchScorecardCommand as a function', async () => {
  const mod = await import('../src/scoringCommands.js');
  assert.equal(typeof mod.getPlayerMatchScorecardCommand, 'function');
});
test('scoringCommands.js exports recordPlayerMatchRackCommand as a function', async () => {
  const mod = await import('../src/scoringCommands.js');
  assert.equal(typeof mod.recordPlayerMatchRackCommand, 'function');
});
test('scoringCommands.js exports undoPlayerMatchRackCommand as a function', async () => {
  const mod = await import('../src/scoringCommands.js');
  assert.equal(typeof mod.undoPlayerMatchRackCommand, 'function');
});
test('scoringCommands.js exports finalizePlayerMatchCommand as a function', async () => {
  const mod = await import('../src/scoringCommands.js');
  assert.equal(typeof mod.finalizePlayerMatchCommand, 'function');
});
test('scoringCommands.js exports correctPlayerMatchCommand as a function', async () => {
  const mod = await import('../src/scoringCommands.js');
  assert.equal(typeof mod.correctPlayerMatchCommand, 'function');
});
