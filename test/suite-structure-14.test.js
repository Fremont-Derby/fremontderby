import test from 'node:test';
import assert from 'node:assert/strict';

test('scheduleAvailabilityEnhancer.js loads and exports its named members', async () => {
  const mod = await import('../src/scheduleAvailabilityEnhancer.js');
  const expected = ["enhanceScheduleAvailability"];
  for (const name of expected) {
    assert.ok(name in mod, 'scheduleAvailabilityEnhancer.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('scheduleAvailabilityEnhancer.js exports enhanceScheduleAvailability as a defined value', async () => {
  const mod = await import('../src/scheduleAvailabilityEnhancer.js');
  assert.notEqual(mod.enhanceScheduleAvailability, undefined, 'enhanceScheduleAvailability is missing');
});
test('schedulePage.js loads and exports its named members', async () => {
  const mod = await import('../src/schedulePage.js');
  const expected = ["renderSchedulePage"];
  for (const name of expected) {
    assert.ok(name in mod, 'schedulePage.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('schedulePage.js exports renderSchedulePage as a defined value', async () => {
  const mod = await import('../src/schedulePage.js');
  assert.notEqual(mod.renderSchedulePage, undefined, 'renderSchedulePage is missing');
});
test('scorableMatchesHttp.js loads and exports its named members', async () => {
  const mod = await import('../src/scorableMatchesHttp.js');
  const expected = ["createScorableMatchesHttpHandlers","scorableMatchesHttpHandlers"];
  for (const name of expected) {
    assert.ok(name in mod, 'scorableMatchesHttp.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('scorableMatchesHttp.js exports createScorableMatchesHttpHandlers as a defined value', async () => {
  const mod = await import('../src/scorableMatchesHttp.js');
  assert.notEqual(mod.createScorableMatchesHttpHandlers, undefined, 'createScorableMatchesHttpHandlers is missing');
});
test('scorableMatchesHttp.js exports scorableMatchesHttpHandlers as a defined value', async () => {
  const mod = await import('../src/scorableMatchesHttp.js');
  assert.notEqual(mod.scorableMatchesHttpHandlers, undefined, 'scorableMatchesHttpHandlers is missing');
});
test('scorableMatchesRepository.js loads and exports its named members', async () => {
  const mod = await import('../src/scorableMatchesRepository.js');
  const expected = ["createScorableMatchesRepository"];
  for (const name of expected) {
    assert.ok(name in mod, 'scorableMatchesRepository.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('scorableMatchesRepository.js exports createScorableMatchesRepository as a defined value', async () => {
  const mod = await import('../src/scorableMatchesRepository.js');
  assert.notEqual(mod.createScorableMatchesRepository, undefined, 'createScorableMatchesRepository is missing');
});
test('scorePickerPage.js loads and exports its named members', async () => {
  const mod = await import('../src/scorePickerPage.js');
  const expected = ["scorePickerRetryAfterSeconds","renderScorePickerPage"];
  for (const name of expected) {
    assert.ok(name in mod, 'scorePickerPage.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('scorePickerPage.js exports scorePickerRetryAfterSeconds as a defined value', async () => {
  const mod = await import('../src/scorePickerPage.js');
  assert.notEqual(mod.scorePickerRetryAfterSeconds, undefined, 'scorePickerRetryAfterSeconds is missing');
});
test('scorePickerPage.js exports renderScorePickerPage as a defined value', async () => {
  const mod = await import('../src/scorePickerPage.js');
  assert.notEqual(mod.renderScorePickerPage, undefined, 'renderScorePickerPage is missing');
});
test('scorecardPage.js loads and exports its named members', async () => {
  const mod = await import('../src/scorecardPage.js');
  const expected = ["resolveRaceCompletion","renderScorecardPage"];
  for (const name of expected) {
    assert.ok(name in mod, 'scorecardPage.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('scorecardPage.js exports resolveRaceCompletion as a defined value', async () => {
  const mod = await import('../src/scorecardPage.js');
  assert.notEqual(mod.resolveRaceCompletion, undefined, 'resolveRaceCompletion is missing');
});
test('scorecardPage.js exports renderScorecardPage as a defined value', async () => {
  const mod = await import('../src/scorecardPage.js');
  assert.notEqual(mod.renderScorecardPage, undefined, 'renderScorecardPage is missing');
});
test('scoringCommands.js loads and exports its named members', async () => {
  const mod = await import('../src/scoringCommands.js');
  const expected = ["getPlayerMatchScorecardCommand","recordPlayerMatchRackCommand","undoPlayerMatchRackCommand","finalizePlayerMatchCommand","correctPlayerMatchCommand"];
  for (const name of expected) {
    assert.ok(name in mod, 'scoringCommands.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('scoringCommands.js exports getPlayerMatchScorecardCommand as a defined value', async () => {
  const mod = await import('../src/scoringCommands.js');
  assert.notEqual(mod.getPlayerMatchScorecardCommand, undefined, 'getPlayerMatchScorecardCommand is missing');
});
test('scoringCommands.js exports recordPlayerMatchRackCommand as a defined value', async () => {
  const mod = await import('../src/scoringCommands.js');
  assert.notEqual(mod.recordPlayerMatchRackCommand, undefined, 'recordPlayerMatchRackCommand is missing');
});
test('scoringCommands.js exports undoPlayerMatchRackCommand as a defined value', async () => {
  const mod = await import('../src/scoringCommands.js');
  assert.notEqual(mod.undoPlayerMatchRackCommand, undefined, 'undoPlayerMatchRackCommand is missing');
});
test('scoringCommands.js exports finalizePlayerMatchCommand as a defined value', async () => {
  const mod = await import('../src/scoringCommands.js');
  assert.notEqual(mod.finalizePlayerMatchCommand, undefined, 'finalizePlayerMatchCommand is missing');
});
test('scoringCommands.js exports correctPlayerMatchCommand as a defined value', async () => {
  const mod = await import('../src/scoringCommands.js');
  assert.notEqual(mod.correctPlayerMatchCommand, undefined, 'correctPlayerMatchCommand is missing');
});
test('scoringRepository.js loads and exports its named members', async () => {
  const mod = await import('../src/scoringRepository.js');
  const expected = ["createScoringRepository"];
  for (const name of expected) {
    assert.ok(name in mod, 'scoringRepository.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('scoringRepository.js exports createScoringRepository as a defined value', async () => {
  const mod = await import('../src/scoringRepository.js');
  assert.notEqual(mod.createScoringRepository, undefined, 'createScoringRepository is missing');
});
test('seasonCloseCommands.js loads and exports its named members', async () => {
  const mod = await import('../src/seasonCloseCommands.js');
  const expected = ["getSeasonCloseReadinessCommand","closeSeasonCommand"];
  for (const name of expected) {
    assert.ok(name in mod, 'seasonCloseCommands.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('seasonCloseCommands.js exports getSeasonCloseReadinessCommand as a defined value', async () => {
  const mod = await import('../src/seasonCloseCommands.js');
  assert.notEqual(mod.getSeasonCloseReadinessCommand, undefined, 'getSeasonCloseReadinessCommand is missing');
});
test('seasonCloseCommands.js exports closeSeasonCommand as a defined value', async () => {
  const mod = await import('../src/seasonCloseCommands.js');
  assert.notEqual(mod.closeSeasonCommand, undefined, 'closeSeasonCommand is missing');
});
test('seasonCloseEnhancer.js loads and exports its named members', async () => {
  const mod = await import('../src/seasonCloseEnhancer.js');
  const expected = ["enhanceSeasonClose"];
  for (const name of expected) {
    assert.ok(name in mod, 'seasonCloseEnhancer.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('seasonCloseEnhancer.js exports enhanceSeasonClose as a defined value', async () => {
  const mod = await import('../src/seasonCloseEnhancer.js');
  assert.notEqual(mod.enhanceSeasonClose, undefined, 'enhanceSeasonClose is missing');
});
