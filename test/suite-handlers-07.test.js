import test from 'node:test';
import assert from 'node:assert/strict';

test('index.js exports handleFinalizeSeasonPrizePayoutsRequest as a function', async () => {
  const mod = await import('../src/index.js');
  assert.equal(typeof mod.handleFinalizeSeasonPrizePayoutsRequest, 'function');
});
test('index.js exports handleGetPlayerMatchScorecardRequest as a function', async () => {
  const mod = await import('../src/index.js');
  assert.equal(typeof mod.handleGetPlayerMatchScorecardRequest, 'function');
});
test('index.js exports handleRecordPlayerMatchRackRequest as a function', async () => {
  const mod = await import('../src/index.js');
  assert.equal(typeof mod.handleRecordPlayerMatchRackRequest, 'function');
});
test('index.js exports handleUndoPlayerMatchRackRequest as a function', async () => {
  const mod = await import('../src/index.js');
  assert.equal(typeof mod.handleUndoPlayerMatchRackRequest, 'function');
});
test('index.js exports handleFinalizePlayerMatchRequest as a function', async () => {
  const mod = await import('../src/index.js');
  assert.equal(typeof mod.handleFinalizePlayerMatchRequest, 'function');
});
test('index.js exports handleCorrectPlayerMatchRequest as a function', async () => {
  const mod = await import('../src/index.js');
  assert.equal(typeof mod.handleCorrectPlayerMatchRequest, 'function');
});
