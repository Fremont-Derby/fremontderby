import test from 'node:test';
import assert from 'node:assert/strict';

test('qaPlayerMissionFramingEnhancer.js loads and exports its named members', async () => {
  const mod = await import('../src/qaPlayerMissionFramingEnhancer.js');
  const expected = ["routeQaPlayerMissionFrame","enhanceQaPlayerMissionFraming"];
  for (const name of expected) {
    assert.ok(name in mod, 'qaPlayerMissionFramingEnhancer.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('qaPlayerNextMatchMission2.js loads and exports its named members', async () => {
  const mod = await import('../src/qaPlayerNextMatchMission2.js');
  const expected = ["activePlayerNextMatchMission","buildPlayerNextMatchSchedule","routeQaPlayerNextMatchMission","enhanceQaPlayerNextMatchMission"];
  for (const name of expected) {
    assert.ok(name in mod, 'qaPlayerNextMatchMission2.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('qaResultUxEnhancer.js loads and exports its named members', async () => {
  const mod = await import('../src/qaResultUxEnhancer.js');
  const expected = ["enhanceQaResultUx"];
  for (const name of expected) {
    assert.ok(name in mod, 'qaResultUxEnhancer.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('qaScorecardHttp.js loads and exports its named members', async () => {
  const mod = await import('../src/qaScorecardHttp.js');
  const expected = ["buildQaScorecardFixture","routeQaScorecard"];
  for (const name of expected) {
    assert.ok(name in mod, 'qaScorecardHttp.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('qaScorecardRouteEnhancer.js loads and exports its named members', async () => {
  const mod = await import('../src/qaScorecardRouteEnhancer.js');
  const expected = ["scoreSubmittedRackHistory","routeQaScorecard"];
  for (const name of expected) {
    assert.ok(name in mod, 'qaScorecardRouteEnhancer.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('rackLedgerScorecard.js loads and exports its named members', async () => {
  const mod = await import('../src/rackLedgerScorecard.js');
  const expected = ["sharedRackLedgerScorecardStyles","sharedRackLedgerScorecardMarkup","sharedRackLedgerScorecardControllerSource","renderRackLedgerScorecardPage"];
  for (const name of expected) {
    assert.ok(name in mod, 'rackLedgerScorecard.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('sandboxFeedbackCommands.js loads and exports its named members', async () => {
  const mod = await import('../src/sandboxFeedbackCommands.js');
  const expected = ["submitSandboxFeedbackCommand","listSandboxFeedbackCommand","resolveSandboxFeedbackCommand"];
  for (const name of expected) {
    assert.ok(name in mod, 'sandboxFeedbackCommands.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('sandboxFeedbackHttp.js loads and exports its named members', async () => {
  const mod = await import('../src/sandboxFeedbackHttp.js');
  const expected = ["createSandboxFeedbackHttpHandlers","sandboxFeedbackHttpHandlers"];
  for (const name of expected) {
    assert.ok(name in mod, 'sandboxFeedbackHttp.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('sandboxFeedbackRepository.js loads and exports its named members', async () => {
  const mod = await import('../src/sandboxFeedbackRepository.js');
  const expected = ["createSandboxFeedbackRepository"];
  for (const name of expected) {
    assert.ok(name in mod, 'sandboxFeedbackRepository.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('sandboxRackLedgerAdapter.js loads and exports its named members', async () => {
  const mod = await import('../src/sandboxRackLedgerAdapter.js');
  const expected = ["playerSandboxFixture","sandboxRackLedgerAdapterSource"];
  for (const name of expected) {
    assert.ok(name in mod, 'sandboxRackLedgerAdapter.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
