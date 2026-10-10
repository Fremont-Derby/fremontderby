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
test('jflFinishedMatchResults.js loads and exports its named members', async () => {
  const mod = await import('../src/jflFinishedMatchResults.js');
  const expected = ["enrichFinishedScheduleRounds"];
  for (const name of expected) {
    assert.ok(name in mod, 'jflFinishedMatchResults.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('jflFreeAgentsPage.js loads and exports its named members', async () => {
  const mod = await import('../src/jflFreeAgentsPage.js');
  const expected = ["captainFreeAgentContexts","preferredFreeAgentRound","safeFreeAgentCandidate","renderJflFreeAgentsPage","routeJflFreeAgents"];
  for (const name of expected) {
    assert.ok(name in mod, 'jflFreeAgentsPage.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('jflModernHome.js loads and exports its named members', async () => {
  const mod = await import('../src/jflModernHome.js');
  const expected = ["chooseHomeNextAction","jflModernHomeStyles","renderJflModernHome","routeJflModernHome"];
  for (const name of expected) {
    assert.ok(name in mod, 'jflModernHome.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('jflModernProfileEnhancer.js loads and exports its named members', async () => {
  const mod = await import('../src/jflModernProfileEnhancer.js');
  const expected = ["modernizeJflProfileHtml","enhanceJflModernProfile"];
  for (const name of expected) {
    assert.ok(name in mod, 'jflModernProfileEnhancer.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('jflModernSchedule.js loads and exports its named members', async () => {
  const mod = await import('../src/jflModernSchedule.js');
  const expected = ["normalizeScheduleRounds","renderScheduleMatchCard","jflModernScheduleStyles","renderJflModernSchedule","routeJflModernSchedule"];
  for (const name of expected) {
    assert.ok(name in mod, 'jflModernSchedule.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('jflModernShell.js loads and exports its named members', async () => {
  const mod = await import('../src/jflModernShell.js');
  const expected = ["MODERN_PRIMARY_DESTINATIONS","MODERN_SECONDARY_DESTINATIONS","formatJflDeployTimestamp","jflDeployTimeClientScript","jflModernShellStyles","decorateJflModernShell"];
  for (const name of expected) {
    assert.ok(name in mod, 'jflModernShell.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('jflModernStandings.js loads and exports its named members', async () => {
  const mod = await import('../src/jflModernStandings.js');
  const expected = ["renderTeamStandingCard","renderIndividualStandingCard","standingsSeasonCandidates","jflModernStandingsStyles","renderJflModernStandings","routeJflModernStandings"];
  for (const name of expected) {
    assert.ok(name in mod, 'jflModernStandings.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('jflModernTeams.js loads and exports its named members', async () => {
  const mod = await import('../src/jflModernTeams.js');
  const expected = ["availableTeamApplicationSeasons","friendlyTeamsError","availableInvitationPlayers","visibleTeamActions","normalizeTeamCards","renderTeamCard","jflModernTeamsStyles","renderJflModernTeams","routeJflModernTeams"];
  for (const name of expected) {
    assert.ok(name in mod, 'jflModernTeams.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('jflNotFoundPage.js loads and exports its named members', async () => {
  const mod = await import('../src/jflNotFoundPage.js');
  const expected = ["renderJflNotFoundPage"];
  for (const name of expected) {
    assert.ok(name in mod, 'jflNotFoundPage.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
