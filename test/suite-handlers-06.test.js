import test from 'node:test';
import assert from 'node:assert/strict';

test('index.js exports handleSetFreeAgentAvailabilityRequest as a function', async () => {
  const mod = await import('../src/index.js');
  assert.equal(typeof mod.handleSetFreeAgentAvailabilityRequest, 'function');
});
test('index.js exports handleListEligibleFreeAgentsRequest as a function', async () => {
  const mod = await import('../src/index.js');
  assert.equal(typeof mod.handleListEligibleFreeAgentsRequest, 'function');
});
test('index.js exports handleSetRosterAvailabilityRequest as a function', async () => {
  const mod = await import('../src/index.js');
  assert.equal(typeof mod.handleSetRosterAvailabilityRequest, 'function');
});
test('index.js exports handleListTeamRoundAvailabilityRequest as a function', async () => {
  const mod = await import('../src/index.js');
  assert.equal(typeof mod.handleListTeamRoundAvailabilityRequest, 'function');
});
test('index.js exports handleSubmitTeamLineupRequest as a function', async () => {
  const mod = await import('../src/index.js');
  assert.equal(typeof mod.handleSubmitTeamLineupRequest, 'function');
});
test('index.js exports handleListVisibleTeamLineupsRequest as a function', async () => {
  const mod = await import('../src/index.js');
  assert.equal(typeof mod.handleListVisibleTeamLineupsRequest, 'function');
});
test('index.js exports handleListPublicSeasonsRequest as a function', async () => {
  const mod = await import('../src/index.js');
  assert.equal(typeof mod.handleListPublicSeasonsRequest, 'function');
});
test('index.js exports handleListSeasonScheduleRequest as a function', async () => {
  const mod = await import('../src/index.js');
  assert.equal(typeof mod.handleListSeasonScheduleRequest, 'function');
});
test('index.js exports handleListTeamStandingsRequest as a function', async () => {
  const mod = await import('../src/index.js');
  assert.equal(typeof mod.handleListTeamStandingsRequest, 'function');
});
test('index.js exports handleListIndividualStandingsRequest as a function', async () => {
  const mod = await import('../src/index.js');
  assert.equal(typeof mod.handleListIndividualStandingsRequest, 'function');
});
test('index.js exports handleGetSeasonPrizeSummaryRequest as a function', async () => {
  const mod = await import('../src/index.js');
  assert.equal(typeof mod.handleGetSeasonPrizeSummaryRequest, 'function');
});
test('index.js exports handleConfigureSeasonPrizesRequest as a function', async () => {
  const mod = await import('../src/index.js');
  assert.equal(typeof mod.handleConfigureSeasonPrizesRequest, 'function');
});
