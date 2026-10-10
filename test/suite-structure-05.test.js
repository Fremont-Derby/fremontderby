import test from 'node:test';
import assert from 'node:assert/strict';

test('environmentFingerprint.js loads and exports its named members', async () => {
  const mod = await import('../src/environmentFingerprint.js');
  const expected = ["environmentFingerprint","injectEnvironmentFingerprint"];
  for (const name of expected) {
    assert.ok(name in mod, 'environmentFingerprint.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('environmentReadiness.js loads and exports its named members', async () => {
  const mod = await import('../src/environmentReadiness.js');
  const expected = ["supabaseProjectRefFromUrl","environmentReadiness"];
  for (const name of expected) {
    assert.ok(name in mod, 'environmentReadiness.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('finishedScheduleEnhancer.js loads and exports its named members', async () => {
  const mod = await import('../src/finishedScheduleEnhancer.js');
  const expected = ["finishedScheduleWinnerSide","finishedScheduleMatchesById","enhanceFinishedScheduleBreakdown"];
  for (const name of expected) {
    assert.ok(name in mod, 'finishedScheduleEnhancer.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('freeAgentCommands.js loads and exports its named members', async () => {
  const mod = await import('../src/freeAgentCommands.js');
  const expected = ["registerFreeAgentCommand","setFreeAgentAvailabilityCommand","listEligibleFreeAgentsCommand"];
  for (const name of expected) {
    assert.ok(name in mod, 'freeAgentCommands.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('freeAgentRepository.js loads and exports its named members', async () => {
  const mod = await import('../src/freeAgentRepository.js');
  const expected = ["createFreeAgentRepository"];
  for (const name of expected) {
    assert.ok(name in mod, 'freeAgentRepository.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('index.js loads and exports its named members', async () => {
  const mod = await import('../src/index.js');
  const expected = ["renderLandingPage","handlePublishScheduleRequest","handleCreateSeasonSetupRequest","handleListAdminSeasonsRequest","handleGetSeasonSetupRequest","handleUpdateSeasonSetupRequest","handleGetOwnProfileRequest","handleSaveOwnProfileRequest","handleCreateTeamRequest","handleGetOwnTeamRegistrationRequest","handleWithdrawTeamApplicationRequest","handleRespondToReturningTeamSlotRequest","handleGetAdminSeasonRegistrationRequest","handleConfigureSeasonRegistrationRequest","handleReviewTeamApplicationRequest","handleManageTeamSlotRequest","handleSeedReturningTeamSlotsRequest","handleListOwnTeamMembershipRequestsRequest","handleRequestTeamMembershipRequest","handleRespondToTeamMembershipRequest","handleCancelTeamMembershipRequest","handleListOwnTeamManagementRequest","handleListOwnTeamTradesRequest","handleInvitePlayerToTeamRequest","handleProposeTeamTradeRequest","handleAdminProposeTeamTradeExceptionRequest","handleRespondToTeamInvitationRequest","handleRespondToTeamTradePlayerRequest","handleApproveTeamTradeCaptainRequest","handleCancelTeamInvitationRequest","handleRemoveTeamMemberRequest","handleRegisterFreeAgentRequest","handleSetFreeAgentAvailabilityRequest","handleListEligibleFreeAgentsRequest","handleSetRosterAvailabilityRequest","handleListTeamRoundAvailabilityRequest","handleSubmitTeamLineupRequest","handleListVisibleTeamLineupsRequest","handleListPublicSeasonsRequest","handleListSeasonScheduleRequest","handleListTeamStandingsRequest","handleListIndividualStandingsRequest","handleGetSeasonPrizeSummaryRequest","handleConfigureSeasonPrizesRequest","handleFinalizeSeasonPrizePayoutsRequest","handleGetPlayerMatchScorecardRequest","handleRecordPlayerMatchRackRequest","handleUndoPlayerMatchRackRequest","handleFinalizePlayerMatchRequest","handleCorrectPlayerMatchRequest"];
  for (const name of expected) {
    assert.ok(name in mod, 'index.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('jfl404Artwork.js loads and exports its named members', async () => {
  const mod = await import('../src/jfl404Artwork.js');
  const expected = ["JFL_404_ARTWORK_DATA_URI"];
  for (const name of expected) {
    assert.ok(name in mod, 'jfl404Artwork.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('jfl404ArtworkPart1.js loads and exports its named members', async () => {
  const mod = await import('../src/jfl404ArtworkPart1.js');
  const expected = ["jfl404ArtworkPart1"];
  for (const name of expected) {
    assert.ok(name in mod, 'jfl404ArtworkPart1.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('jfl404ArtworkPart2.js loads and exports its named members', async () => {
  const mod = await import('../src/jfl404ArtworkPart2.js');
  const expected = ["jfl404ArtworkPart2"];
  for (const name of expected) {
    assert.ok(name in mod, 'jfl404ArtworkPart2.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('jfl404ArtworkPart3.js loads and exports its named members', async () => {
  const mod = await import('../src/jfl404ArtworkPart3.js');
  const expected = ["jfl404ArtworkPart3"];
  for (const name of expected) {
    assert.ok(name in mod, 'jfl404ArtworkPart3.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
