import test from 'node:test';
import assert from 'node:assert/strict';

test('chatRepository.js loads and exports its named members', async () => {
  const mod = await import('../src/chatRepository.js');
  const expected = ["createChatRepository"];
  for (const name of expected) {
    assert.ok(name in mod, 'chatRepository.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('dateAvailabilityHttp.js loads and exports its named members', async () => {
  const mod = await import('../src/dateAvailabilityHttp.js');
  const expected = ["routeDateAvailability"];
  for (const name of expected) {
    assert.ok(name in mod, 'dateAvailabilityHttp.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('dateAvailabilityRepository.js loads and exports its named members', async () => {
  const mod = await import('../src/dateAvailabilityRepository.js');
  const expected = ["createDateAvailabilityRepository"];
  for (const name of expected) {
    assert.ok(name in mod, 'dateAvailabilityRepository.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('demoSeasonPage.js loads and exports its named members', async () => {
  const mod = await import('../src/demoSeasonPage.js');
  const expected = ["renderDemoSeasonPage"];
  for (const name of expected) {
    assert.ok(name in mod, 'demoSeasonPage.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('designSystem.js loads and exports its named members', async () => {
  const mod = await import('../src/designSystem.js');
  const expected = ["designSystemStyles","injectDesignSystem"];
  for (const name of expected) {
    assert.ok(name in mod, 'designSystem.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('directMessageConsentHttp.js loads and exports its named members', async () => {
  const mod = await import('../src/directMessageConsentHttp.js');
  const expected = ["routeDirectMessageConsent"];
  for (const name of expected) {
    assert.ok(name in mod, 'directMessageConsentHttp.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('dualScoringCommands.js loads and exports its named members', async () => {
  const mod = await import('../src/dualScoringCommands.js');
  const expected = ["getPlayerMatchScoreComparisonCommand","setPlayerMatchOpeningDisciplineCommand","recordPlayerMatchScoreRackCommand","updatePlayerMatchScoreRackCommand","undoPlayerMatchScoreRackCommand","confirmPlayerMatchScoreCommand","finalizeReconciledPlayerMatchCommand","adminOverrideReconciledPlayerMatchCommand"];
  for (const name of expected) {
    assert.ok(name in mod, 'dualScoringCommands.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('dualScoringHttp.js loads and exports its named members', async () => {
  const mod = await import('../src/dualScoringHttp.js');
  const expected = ["createDualScoringHttpHandlers","dualScoringHttpHandlers"];
  for (const name of expected) {
    assert.ok(name in mod, 'dualScoringHttp.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('dualScoringRepository.js loads and exports its named members', async () => {
  const mod = await import('../src/dualScoringRepository.js');
  const expected = ["createDualScoringRepository"];
  for (const name of expected) {
    assert.ok(name in mod, 'dualScoringRepository.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
