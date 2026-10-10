import test from 'node:test';
import assert from 'node:assert/strict';

test('adminOperationsRepository.js exports createAdminOperationsRepository as a function', async () => {
  const mod = await import('../src/adminOperationsRepository.js');
  assert.equal(typeof mod.createAdminOperationsRepository, 'function');
});
test('adminPlayersRepository.js exports createAdminPlayersRepository as a function', async () => {
  const mod = await import('../src/adminPlayersRepository.js');
  assert.equal(typeof mod.createAdminPlayersRepository, 'function');
});
test('adminSeasonTeamsHttp.js exports createAdminSeasonTeamsHttpHandlers as a function', async () => {
  const mod = await import('../src/adminSeasonTeamsHttp.js');
  assert.equal(typeof mod.createAdminSeasonTeamsHttpHandlers, 'function');
});
test('adminSeasonTeamsRepository.js exports createAdminSeasonTeamsRepository as a function', async () => {
  const mod = await import('../src/adminSeasonTeamsRepository.js');
  assert.equal(typeof mod.createAdminSeasonTeamsRepository, 'function');
});
test('availabilityRepository.js exports createAvailabilityRepository as a function', async () => {
  const mod = await import('../src/availabilityRepository.js');
  assert.equal(typeof mod.createAvailabilityRepository, 'function');
});
test('chatRepository.js exports createChatRepository as a function', async () => {
  const mod = await import('../src/chatRepository.js');
  assert.equal(typeof mod.createChatRepository, 'function');
});
test('dateAvailabilityRepository.js exports createDateAvailabilityRepository as a function', async () => {
  const mod = await import('../src/dateAvailabilityRepository.js');
  assert.equal(typeof mod.createDateAvailabilityRepository, 'function');
});
test('dualScoringHttp.js exports createDualScoringHttpHandlers as a function', async () => {
  const mod = await import('../src/dualScoringHttp.js');
  assert.equal(typeof mod.createDualScoringHttpHandlers, 'function');
});
test('dualScoringRepository.js exports createDualScoringRepository as a function', async () => {
  const mod = await import('../src/dualScoringRepository.js');
  assert.equal(typeof mod.createDualScoringRepository, 'function');
});
test('freeAgentRepository.js exports createFreeAgentRepository as a function', async () => {
  const mod = await import('../src/freeAgentRepository.js');
  assert.equal(typeof mod.createFreeAgentRepository, 'function');
});
test('jflNotificationsHttp.js exports createJflNotificationsRoute as a function', async () => {
  const mod = await import('../src/jflNotificationsHttp.js');
  assert.equal(typeof mod.createJflNotificationsRoute, 'function');
});
test('jflQaResultsHttp.js exports createJflQaResultsRoute as a function', async () => {
  const mod = await import('../src/jflQaResultsHttp.js');
  assert.equal(typeof mod.createJflQaResultsRoute, 'function');
});
test('lineupRepository.js exports createLineupRepository as a function', async () => {
  const mod = await import('../src/lineupRepository.js');
  assert.equal(typeof mod.createLineupRepository, 'function');
});
test('playerClaimRepository.js exports createPlayerClaimRepository as a function', async () => {
  const mod = await import('../src/playerClaimRepository.js');
  assert.equal(typeof mod.createPlayerClaimRepository, 'function');
});
test('playerContactRepository.js exports createPlayerContactRepository as a function', async () => {
  const mod = await import('../src/playerContactRepository.js');
  assert.equal(typeof mod.createPlayerContactRepository, 'function');
});
test('playerProfileRepository.js exports createPlayerProfileRepository as a function', async () => {
  const mod = await import('../src/playerProfileRepository.js');
  assert.equal(typeof mod.createPlayerProfileRepository, 'function');
});
test('playoffHttp.js exports createPlayoffHttpHandlers as a function', async () => {
  const mod = await import('../src/playoffHttp.js');
  assert.equal(typeof mod.createPlayoffHttpHandlers, 'function');
});
test('playoffRepository.js exports createPlayoffRepository as a function', async () => {
  const mod = await import('../src/playoffRepository.js');
  assert.equal(typeof mod.createPlayoffRepository, 'function');
});
test('prizeRepository.js exports createPrizeRepository as a function', async () => {
  const mod = await import('../src/prizeRepository.js');
  assert.equal(typeof mod.createPrizeRepository, 'function');
});
test('qaEvidenceHttp.js exports createQaEvidenceHttp as a function', async () => {
  const mod = await import('../src/qaEvidenceHttp.js');
  assert.equal(typeof mod.createQaEvidenceHttp, 'function');
});
test('qaEvidenceRepository.js exports createQaEvidenceRepository as a function', async () => {
  const mod = await import('../src/qaEvidenceRepository.js');
  assert.equal(typeof mod.createQaEvidenceRepository, 'function');
});
test('sandboxFeedbackHttp.js exports createSandboxFeedbackHttpHandlers as a function', async () => {
  const mod = await import('../src/sandboxFeedbackHttp.js');
  assert.equal(typeof mod.createSandboxFeedbackHttpHandlers, 'function');
});
test('sandboxFeedbackRepository.js exports createSandboxFeedbackRepository as a function', async () => {
  const mod = await import('../src/sandboxFeedbackRepository.js');
  assert.equal(typeof mod.createSandboxFeedbackRepository, 'function');
});
test('scorableMatchesHttp.js exports createScorableMatchesHttpHandlers as a function', async () => {
  const mod = await import('../src/scorableMatchesHttp.js');
  assert.equal(typeof mod.createScorableMatchesHttpHandlers, 'function');
});
test('scorableMatchesRepository.js exports createScorableMatchesRepository as a function', async () => {
  const mod = await import('../src/scorableMatchesRepository.js');
  assert.equal(typeof mod.createScorableMatchesRepository, 'function');
});
test('scoringRepository.js exports createScoringRepository as a function', async () => {
  const mod = await import('../src/scoringRepository.js');
  assert.equal(typeof mod.createScoringRepository, 'function');
});
test('seasonCloseRepository.js exports createSeasonCloseRepository as a function', async () => {
  const mod = await import('../src/seasonCloseRepository.js');
  assert.equal(typeof mod.createSeasonCloseRepository, 'function');
});
test('seasonRegistrationRepository.js exports createSeasonRegistrationRepository as a function', async () => {
  const mod = await import('../src/seasonRegistrationRepository.js');
  assert.equal(typeof mod.createSeasonRegistrationRepository, 'function');
});
test('standingsRepository.js exports createStandingsRepository as a function', async () => {
  const mod = await import('../src/standingsRepository.js');
  assert.equal(typeof mod.createStandingsRepository, 'function');
});
test('supabaseSeasonRepository.js exports createSupabaseSeasonRepository as a function', async () => {
  const mod = await import('../src/supabaseSeasonRepository.js');
  assert.equal(typeof mod.createSupabaseSeasonRepository, 'function');
});
test('teamMatchChoiceRepository.js exports createTeamMatchChoiceRepository as a function', async () => {
  const mod = await import('../src/teamMatchChoiceRepository.js');
  assert.equal(typeof mod.createTeamMatchChoiceRepository, 'function');
});
test('teamMembershipRequestHttp.js exports createTeamMembershipRequestHttpHandlers as a function', async () => {
  const mod = await import('../src/teamMembershipRequestHttp.js');
  assert.equal(typeof mod.createTeamMembershipRequestHttpHandlers, 'function');
});
test('teamMembershipRequestRepository.js exports createTeamMembershipRequestRepository as a function', async () => {
  const mod = await import('../src/teamMembershipRequestRepository.js');
  assert.equal(typeof mod.createTeamMembershipRequestRepository, 'function');
});
test('teamRegistrationRepository.js exports createTeamRegistrationRepository as a function', async () => {
  const mod = await import('../src/teamRegistrationRepository.js');
  assert.equal(typeof mod.createTeamRegistrationRepository, 'function');
});
test('teamRepository.js exports createTeamRepository as a function', async () => {
  const mod = await import('../src/teamRepository.js');
  assert.equal(typeof mod.createTeamRepository, 'function');
});
