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
test('schedulePage.js loads and exports its named members', async () => {
  const mod = await import('../src/schedulePage.js');
  const expected = ["renderSchedulePage"];
  for (const name of expected) {
    assert.ok(name in mod, 'schedulePage.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('scorableMatchesHttp.js loads and exports its named members', async () => {
  const mod = await import('../src/scorableMatchesHttp.js');
  const expected = ["createScorableMatchesHttpHandlers","scorableMatchesHttpHandlers"];
  for (const name of expected) {
    assert.ok(name in mod, 'scorableMatchesHttp.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('scorableMatchesRepository.js loads and exports its named members', async () => {
  const mod = await import('../src/scorableMatchesRepository.js');
  const expected = ["createScorableMatchesRepository"];
  for (const name of expected) {
    assert.ok(name in mod, 'scorableMatchesRepository.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('scorePickerPage.js loads and exports its named members', async () => {
  const mod = await import('../src/scorePickerPage.js');
  const expected = ["scorePickerRetryAfterSeconds","renderScorePickerPage"];
  for (const name of expected) {
    assert.ok(name in mod, 'scorePickerPage.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('scorecardPage.js loads and exports its named members', async () => {
  const mod = await import('../src/scorecardPage.js');
  const expected = ["resolveRaceCompletion","renderScorecardPage"];
  for (const name of expected) {
    assert.ok(name in mod, 'scorecardPage.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('scoringCommands.js loads and exports its named members', async () => {
  const mod = await import('../src/scoringCommands.js');
  const expected = ["getPlayerMatchScorecardCommand","recordPlayerMatchRackCommand","undoPlayerMatchRackCommand","finalizePlayerMatchCommand","correctPlayerMatchCommand"];
  for (const name of expected) {
    assert.ok(name in mod, 'scoringCommands.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('scoringRepository.js loads and exports its named members', async () => {
  const mod = await import('../src/scoringRepository.js');
  const expected = ["createScoringRepository"];
  for (const name of expected) {
    assert.ok(name in mod, 'scoringRepository.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('seasonCloseCommands.js loads and exports its named members', async () => {
  const mod = await import('../src/seasonCloseCommands.js');
  const expected = ["getSeasonCloseReadinessCommand","closeSeasonCommand"];
  for (const name of expected) {
    assert.ok(name in mod, 'seasonCloseCommands.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('seasonCloseEnhancer.js loads and exports its named members', async () => {
  const mod = await import('../src/seasonCloseEnhancer.js');
  const expected = ["enhanceSeasonClose"];
  for (const name of expected) {
    assert.ok(name in mod, 'seasonCloseEnhancer.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
