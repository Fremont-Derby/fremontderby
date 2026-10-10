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
test('chatRepository.js exports createChatRepository as a defined value', async () => {
  const mod = await import('../src/chatRepository.js');
  assert.notEqual(mod.createChatRepository, undefined, 'createChatRepository is missing');
});
test('dateAvailabilityHttp.js loads and exports its named members', async () => {
  const mod = await import('../src/dateAvailabilityHttp.js');
  const expected = ["routeDateAvailability"];
  for (const name of expected) {
    assert.ok(name in mod, 'dateAvailabilityHttp.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('dateAvailabilityHttp.js exports routeDateAvailability as a defined value', async () => {
  const mod = await import('../src/dateAvailabilityHttp.js');
  assert.notEqual(mod.routeDateAvailability, undefined, 'routeDateAvailability is missing');
});
test('dateAvailabilityRepository.js loads and exports its named members', async () => {
  const mod = await import('../src/dateAvailabilityRepository.js');
  const expected = ["createDateAvailabilityRepository"];
  for (const name of expected) {
    assert.ok(name in mod, 'dateAvailabilityRepository.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('dateAvailabilityRepository.js exports createDateAvailabilityRepository as a defined value', async () => {
  const mod = await import('../src/dateAvailabilityRepository.js');
  assert.notEqual(mod.createDateAvailabilityRepository, undefined, 'createDateAvailabilityRepository is missing');
});
test('demoSeasonPage.js loads and exports its named members', async () => {
  const mod = await import('../src/demoSeasonPage.js');
  const expected = ["renderDemoSeasonPage"];
  for (const name of expected) {
    assert.ok(name in mod, 'demoSeasonPage.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('demoSeasonPage.js exports renderDemoSeasonPage as a defined value', async () => {
  const mod = await import('../src/demoSeasonPage.js');
  assert.notEqual(mod.renderDemoSeasonPage, undefined, 'renderDemoSeasonPage is missing');
});
test('designSystem.js loads and exports its named members', async () => {
  const mod = await import('../src/designSystem.js');
  const expected = ["designSystemStyles","injectDesignSystem"];
  for (const name of expected) {
    assert.ok(name in mod, 'designSystem.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('designSystem.js exports designSystemStyles as a defined value', async () => {
  const mod = await import('../src/designSystem.js');
  assert.notEqual(mod.designSystemStyles, undefined, 'designSystemStyles is missing');
});
test('designSystem.js exports injectDesignSystem as a defined value', async () => {
  const mod = await import('../src/designSystem.js');
  assert.notEqual(mod.injectDesignSystem, undefined, 'injectDesignSystem is missing');
});
test('directMessageConsentHttp.js loads and exports its named members', async () => {
  const mod = await import('../src/directMessageConsentHttp.js');
  const expected = ["routeDirectMessageConsent"];
  for (const name of expected) {
    assert.ok(name in mod, 'directMessageConsentHttp.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('directMessageConsentHttp.js exports routeDirectMessageConsent as a defined value', async () => {
  const mod = await import('../src/directMessageConsentHttp.js');
  assert.notEqual(mod.routeDirectMessageConsent, undefined, 'routeDirectMessageConsent is missing');
});
test('dualScoringCommands.js loads and exports its named members', async () => {
  const mod = await import('../src/dualScoringCommands.js');
  const expected = ["getPlayerMatchScoreComparisonCommand","setPlayerMatchOpeningDisciplineCommand","recordPlayerMatchScoreRackCommand","updatePlayerMatchScoreRackCommand","undoPlayerMatchScoreRackCommand","confirmPlayerMatchScoreCommand","finalizeReconciledPlayerMatchCommand","adminOverrideReconciledPlayerMatchCommand"];
  for (const name of expected) {
    assert.ok(name in mod, 'dualScoringCommands.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('dualScoringCommands.js exports getPlayerMatchScoreComparisonCommand as a defined value', async () => {
  const mod = await import('../src/dualScoringCommands.js');
  assert.notEqual(mod.getPlayerMatchScoreComparisonCommand, undefined, 'getPlayerMatchScoreComparisonCommand is missing');
});
test('dualScoringCommands.js exports setPlayerMatchOpeningDisciplineCommand as a defined value', async () => {
  const mod = await import('../src/dualScoringCommands.js');
  assert.notEqual(mod.setPlayerMatchOpeningDisciplineCommand, undefined, 'setPlayerMatchOpeningDisciplineCommand is missing');
});
test('dualScoringCommands.js exports recordPlayerMatchScoreRackCommand as a defined value', async () => {
  const mod = await import('../src/dualScoringCommands.js');
  assert.notEqual(mod.recordPlayerMatchScoreRackCommand, undefined, 'recordPlayerMatchScoreRackCommand is missing');
});
test('dualScoringCommands.js exports updatePlayerMatchScoreRackCommand as a defined value', async () => {
  const mod = await import('../src/dualScoringCommands.js');
  assert.notEqual(mod.updatePlayerMatchScoreRackCommand, undefined, 'updatePlayerMatchScoreRackCommand is missing');
});
test('dualScoringCommands.js exports undoPlayerMatchScoreRackCommand as a defined value', async () => {
  const mod = await import('../src/dualScoringCommands.js');
  assert.notEqual(mod.undoPlayerMatchScoreRackCommand, undefined, 'undoPlayerMatchScoreRackCommand is missing');
});
test('dualScoringCommands.js exports confirmPlayerMatchScoreCommand as a defined value', async () => {
  const mod = await import('../src/dualScoringCommands.js');
  assert.notEqual(mod.confirmPlayerMatchScoreCommand, undefined, 'confirmPlayerMatchScoreCommand is missing');
});
test('dualScoringCommands.js exports finalizeReconciledPlayerMatchCommand as a defined value', async () => {
  const mod = await import('../src/dualScoringCommands.js');
  assert.notEqual(mod.finalizeReconciledPlayerMatchCommand, undefined, 'finalizeReconciledPlayerMatchCommand is missing');
});
test('dualScoringCommands.js exports adminOverrideReconciledPlayerMatchCommand as a defined value', async () => {
  const mod = await import('../src/dualScoringCommands.js');
  assert.notEqual(mod.adminOverrideReconciledPlayerMatchCommand, undefined, 'adminOverrideReconciledPlayerMatchCommand is missing');
});
test('dualScoringHttp.js loads and exports its named members', async () => {
  const mod = await import('../src/dualScoringHttp.js');
  const expected = ["createDualScoringHttpHandlers","dualScoringHttpHandlers"];
  for (const name of expected) {
    assert.ok(name in mod, 'dualScoringHttp.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('dualScoringHttp.js exports createDualScoringHttpHandlers as a defined value', async () => {
  const mod = await import('../src/dualScoringHttp.js');
  assert.notEqual(mod.createDualScoringHttpHandlers, undefined, 'createDualScoringHttpHandlers is missing');
});
test('dualScoringHttp.js exports dualScoringHttpHandlers as a defined value', async () => {
  const mod = await import('../src/dualScoringHttp.js');
  assert.notEqual(mod.dualScoringHttpHandlers, undefined, 'dualScoringHttpHandlers is missing');
});
test('dualScoringRepository.js loads and exports its named members', async () => {
  const mod = await import('../src/dualScoringRepository.js');
  const expected = ["createDualScoringRepository"];
  for (const name of expected) {
    assert.ok(name in mod, 'dualScoringRepository.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('dualScoringRepository.js exports createDualScoringRepository as a defined value', async () => {
  const mod = await import('../src/dualScoringRepository.js');
  assert.notEqual(mod.createDualScoringRepository, undefined, 'createDualScoringRepository is missing');
});
