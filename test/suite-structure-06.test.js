import test from 'node:test';
import assert from 'node:assert/strict';

test('jfl404ArtworkPart4.js loads and exports its named members', async () => {
  const mod = await import('../src/jfl404ArtworkPart4.js');
  const expected = ["jfl404ArtworkPart4"];
  for (const name of expected) {
    assert.ok(name in mod, 'jfl404ArtworkPart4.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('jfl404ArtworkPart4.js exports jfl404ArtworkPart4 as a defined value', async () => {
  const mod = await import('../src/jfl404ArtworkPart4.js');
  assert.notEqual(mod.jfl404ArtworkPart4, undefined, 'jfl404ArtworkPart4 is missing');
});
test('jflFinishedMatchResults.js loads and exports its named members', async () => {
  const mod = await import('../src/jflFinishedMatchResults.js');
  const expected = ["enrichFinishedScheduleRounds"];
  for (const name of expected) {
    assert.ok(name in mod, 'jflFinishedMatchResults.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('jflFinishedMatchResults.js exports enrichFinishedScheduleRounds as a defined value', async () => {
  const mod = await import('../src/jflFinishedMatchResults.js');
  assert.notEqual(mod.enrichFinishedScheduleRounds, undefined, 'enrichFinishedScheduleRounds is missing');
});
test('jflFreeAgentsPage.js loads and exports its named members', async () => {
  const mod = await import('../src/jflFreeAgentsPage.js');
  const expected = ["captainFreeAgentContexts","preferredFreeAgentRound","safeFreeAgentCandidate","renderJflFreeAgentsPage","routeJflFreeAgents"];
  for (const name of expected) {
    assert.ok(name in mod, 'jflFreeAgentsPage.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('jflFreeAgentsPage.js exports captainFreeAgentContexts as a defined value', async () => {
  const mod = await import('../src/jflFreeAgentsPage.js');
  assert.notEqual(mod.captainFreeAgentContexts, undefined, 'captainFreeAgentContexts is missing');
});
test('jflFreeAgentsPage.js exports preferredFreeAgentRound as a defined value', async () => {
  const mod = await import('../src/jflFreeAgentsPage.js');
  assert.notEqual(mod.preferredFreeAgentRound, undefined, 'preferredFreeAgentRound is missing');
});
test('jflFreeAgentsPage.js exports safeFreeAgentCandidate as a defined value', async () => {
  const mod = await import('../src/jflFreeAgentsPage.js');
  assert.notEqual(mod.safeFreeAgentCandidate, undefined, 'safeFreeAgentCandidate is missing');
});
test('jflFreeAgentsPage.js exports renderJflFreeAgentsPage as a defined value', async () => {
  const mod = await import('../src/jflFreeAgentsPage.js');
  assert.notEqual(mod.renderJflFreeAgentsPage, undefined, 'renderJflFreeAgentsPage is missing');
});
test('jflFreeAgentsPage.js exports routeJflFreeAgents as a defined value', async () => {
  const mod = await import('../src/jflFreeAgentsPage.js');
  assert.notEqual(mod.routeJflFreeAgents, undefined, 'routeJflFreeAgents is missing');
});
test('jflModernHome.js loads and exports its named members', async () => {
  const mod = await import('../src/jflModernHome.js');
  const expected = ["chooseHomeNextAction","jflModernHomeStyles","renderJflModernHome","routeJflModernHome"];
  for (const name of expected) {
    assert.ok(name in mod, 'jflModernHome.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('jflModernHome.js exports chooseHomeNextAction as a defined value', async () => {
  const mod = await import('../src/jflModernHome.js');
  assert.notEqual(mod.chooseHomeNextAction, undefined, 'chooseHomeNextAction is missing');
});
test('jflModernHome.js exports jflModernHomeStyles as a defined value', async () => {
  const mod = await import('../src/jflModernHome.js');
  assert.notEqual(mod.jflModernHomeStyles, undefined, 'jflModernHomeStyles is missing');
});
test('jflModernHome.js exports renderJflModernHome as a defined value', async () => {
  const mod = await import('../src/jflModernHome.js');
  assert.notEqual(mod.renderJflModernHome, undefined, 'renderJflModernHome is missing');
});
test('jflModernHome.js exports routeJflModernHome as a defined value', async () => {
  const mod = await import('../src/jflModernHome.js');
  assert.notEqual(mod.routeJflModernHome, undefined, 'routeJflModernHome is missing');
});
test('jflModernProfileEnhancer.js loads and exports its named members', async () => {
  const mod = await import('../src/jflModernProfileEnhancer.js');
  const expected = ["modernizeJflProfileHtml","enhanceJflModernProfile"];
  for (const name of expected) {
    assert.ok(name in mod, 'jflModernProfileEnhancer.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('jflModernProfileEnhancer.js exports modernizeJflProfileHtml as a defined value', async () => {
  const mod = await import('../src/jflModernProfileEnhancer.js');
  assert.notEqual(mod.modernizeJflProfileHtml, undefined, 'modernizeJflProfileHtml is missing');
});
test('jflModernProfileEnhancer.js exports enhanceJflModernProfile as a defined value', async () => {
  const mod = await import('../src/jflModernProfileEnhancer.js');
  assert.notEqual(mod.enhanceJflModernProfile, undefined, 'enhanceJflModernProfile is missing');
});
test('jflModernSchedule.js loads and exports its named members', async () => {
  const mod = await import('../src/jflModernSchedule.js');
  const expected = ["normalizeScheduleRounds","renderScheduleMatchCard","jflModernScheduleStyles","renderJflModernSchedule","routeJflModernSchedule"];
  for (const name of expected) {
    assert.ok(name in mod, 'jflModernSchedule.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('jflModernSchedule.js exports normalizeScheduleRounds as a defined value', async () => {
  const mod = await import('../src/jflModernSchedule.js');
  assert.notEqual(mod.normalizeScheduleRounds, undefined, 'normalizeScheduleRounds is missing');
});
test('jflModernSchedule.js exports renderScheduleMatchCard as a defined value', async () => {
  const mod = await import('../src/jflModernSchedule.js');
  assert.notEqual(mod.renderScheduleMatchCard, undefined, 'renderScheduleMatchCard is missing');
});
test('jflModernSchedule.js exports jflModernScheduleStyles as a defined value', async () => {
  const mod = await import('../src/jflModernSchedule.js');
  assert.notEqual(mod.jflModernScheduleStyles, undefined, 'jflModernScheduleStyles is missing');
});
test('jflModernSchedule.js exports renderJflModernSchedule as a defined value', async () => {
  const mod = await import('../src/jflModernSchedule.js');
  assert.notEqual(mod.renderJflModernSchedule, undefined, 'renderJflModernSchedule is missing');
});
test('jflModernSchedule.js exports routeJflModernSchedule as a defined value', async () => {
  const mod = await import('../src/jflModernSchedule.js');
  assert.notEqual(mod.routeJflModernSchedule, undefined, 'routeJflModernSchedule is missing');
});
test('jflModernShell.js loads and exports its named members', async () => {
  const mod = await import('../src/jflModernShell.js');
  const expected = ["MODERN_PRIMARY_DESTINATIONS","MODERN_SECONDARY_DESTINATIONS","formatJflDeployTimestamp","jflDeployTimeClientScript","jflModernShellStyles","decorateJflModernShell"];
  for (const name of expected) {
    assert.ok(name in mod, 'jflModernShell.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('jflModernShell.js exports MODERN_PRIMARY_DESTINATIONS as a defined value', async () => {
  const mod = await import('../src/jflModernShell.js');
  assert.notEqual(mod.MODERN_PRIMARY_DESTINATIONS, undefined, 'MODERN_PRIMARY_DESTINATIONS is missing');
});
test('jflModernShell.js exports MODERN_SECONDARY_DESTINATIONS as a defined value', async () => {
  const mod = await import('../src/jflModernShell.js');
  assert.notEqual(mod.MODERN_SECONDARY_DESTINATIONS, undefined, 'MODERN_SECONDARY_DESTINATIONS is missing');
});
test('jflModernShell.js exports formatJflDeployTimestamp as a defined value', async () => {
  const mod = await import('../src/jflModernShell.js');
  assert.notEqual(mod.formatJflDeployTimestamp, undefined, 'formatJflDeployTimestamp is missing');
});
test('jflModernShell.js exports jflDeployTimeClientScript as a defined value', async () => {
  const mod = await import('../src/jflModernShell.js');
  assert.notEqual(mod.jflDeployTimeClientScript, undefined, 'jflDeployTimeClientScript is missing');
});
test('jflModernShell.js exports jflModernShellStyles as a defined value', async () => {
  const mod = await import('../src/jflModernShell.js');
  assert.notEqual(mod.jflModernShellStyles, undefined, 'jflModernShellStyles is missing');
});
test('jflModernShell.js exports decorateJflModernShell as a defined value', async () => {
  const mod = await import('../src/jflModernShell.js');
  assert.notEqual(mod.decorateJflModernShell, undefined, 'decorateJflModernShell is missing');
});
test('jflModernStandings.js loads and exports its named members', async () => {
  const mod = await import('../src/jflModernStandings.js');
  const expected = ["renderTeamStandingCard","renderIndividualStandingCard","standingsSeasonCandidates","jflModernStandingsStyles","renderJflModernStandings","routeJflModernStandings"];
  for (const name of expected) {
    assert.ok(name in mod, 'jflModernStandings.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('jflModernStandings.js exports renderTeamStandingCard as a defined value', async () => {
  const mod = await import('../src/jflModernStandings.js');
  assert.notEqual(mod.renderTeamStandingCard, undefined, 'renderTeamStandingCard is missing');
});
test('jflModernStandings.js exports renderIndividualStandingCard as a defined value', async () => {
  const mod = await import('../src/jflModernStandings.js');
  assert.notEqual(mod.renderIndividualStandingCard, undefined, 'renderIndividualStandingCard is missing');
});
test('jflModernStandings.js exports standingsSeasonCandidates as a defined value', async () => {
  const mod = await import('../src/jflModernStandings.js');
  assert.notEqual(mod.standingsSeasonCandidates, undefined, 'standingsSeasonCandidates is missing');
});
test('jflModernStandings.js exports jflModernStandingsStyles as a defined value', async () => {
  const mod = await import('../src/jflModernStandings.js');
  assert.notEqual(mod.jflModernStandingsStyles, undefined, 'jflModernStandingsStyles is missing');
});
test('jflModernStandings.js exports renderJflModernStandings as a defined value', async () => {
  const mod = await import('../src/jflModernStandings.js');
  assert.notEqual(mod.renderJflModernStandings, undefined, 'renderJflModernStandings is missing');
});
test('jflModernStandings.js exports routeJflModernStandings as a defined value', async () => {
  const mod = await import('../src/jflModernStandings.js');
  assert.notEqual(mod.routeJflModernStandings, undefined, 'routeJflModernStandings is missing');
});
test('jflModernTeams.js loads and exports its named members', async () => {
  const mod = await import('../src/jflModernTeams.js');
  const expected = ["availableTeamApplicationSeasons","friendlyTeamsError","availableInvitationPlayers","visibleTeamActions","normalizeTeamCards","renderTeamCard","jflModernTeamsStyles","renderJflModernTeams","routeJflModernTeams"];
  for (const name of expected) {
    assert.ok(name in mod, 'jflModernTeams.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('jflModernTeams.js exports availableTeamApplicationSeasons as a defined value', async () => {
  const mod = await import('../src/jflModernTeams.js');
  assert.notEqual(mod.availableTeamApplicationSeasons, undefined, 'availableTeamApplicationSeasons is missing');
});
test('jflModernTeams.js exports friendlyTeamsError as a defined value', async () => {
  const mod = await import('../src/jflModernTeams.js');
  assert.notEqual(mod.friendlyTeamsError, undefined, 'friendlyTeamsError is missing');
});
test('jflModernTeams.js exports availableInvitationPlayers as a defined value', async () => {
  const mod = await import('../src/jflModernTeams.js');
  assert.notEqual(mod.availableInvitationPlayers, undefined, 'availableInvitationPlayers is missing');
});
test('jflModernTeams.js exports visibleTeamActions as a defined value', async () => {
  const mod = await import('../src/jflModernTeams.js');
  assert.notEqual(mod.visibleTeamActions, undefined, 'visibleTeamActions is missing');
});
test('jflModernTeams.js exports normalizeTeamCards as a defined value', async () => {
  const mod = await import('../src/jflModernTeams.js');
  assert.notEqual(mod.normalizeTeamCards, undefined, 'normalizeTeamCards is missing');
});
test('jflModernTeams.js exports renderTeamCard as a defined value', async () => {
  const mod = await import('../src/jflModernTeams.js');
  assert.notEqual(mod.renderTeamCard, undefined, 'renderTeamCard is missing');
});
test('jflModernTeams.js exports jflModernTeamsStyles as a defined value', async () => {
  const mod = await import('../src/jflModernTeams.js');
  assert.notEqual(mod.jflModernTeamsStyles, undefined, 'jflModernTeamsStyles is missing');
});
test('jflModernTeams.js exports renderJflModernTeams as a defined value', async () => {
  const mod = await import('../src/jflModernTeams.js');
  assert.notEqual(mod.renderJflModernTeams, undefined, 'renderJflModernTeams is missing');
});
test('jflModernTeams.js exports routeJflModernTeams as a defined value', async () => {
  const mod = await import('../src/jflModernTeams.js');
  assert.notEqual(mod.routeJflModernTeams, undefined, 'routeJflModernTeams is missing');
});
test('jflNotFoundPage.js loads and exports its named members', async () => {
  const mod = await import('../src/jflNotFoundPage.js');
  const expected = ["renderJflNotFoundPage"];
  for (const name of expected) {
    assert.ok(name in mod, 'jflNotFoundPage.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('jflNotFoundPage.js exports renderJflNotFoundPage as a defined value', async () => {
  const mod = await import('../src/jflNotFoundPage.js');
  assert.notEqual(mod.renderJflNotFoundPage, undefined, 'renderJflNotFoundPage is missing');
});
