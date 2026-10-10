import test from 'node:test';
import assert from 'node:assert/strict';

test('jflModernStandings.js renderTeamStandingCard has a usable type', async () => {
  const mod = await import('../src/jflModernStandings.js');
  const value = mod.renderTeamStandingCard;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('jflModernStandings.js renderIndividualStandingCard has a usable type', async () => {
  const mod = await import('../src/jflModernStandings.js');
  const value = mod.renderIndividualStandingCard;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('jflModernStandings.js standingsSeasonCandidates has a usable type', async () => {
  const mod = await import('../src/jflModernStandings.js');
  const value = mod.standingsSeasonCandidates;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('jflModernStandings.js jflModernStandingsStyles has a usable type', async () => {
  const mod = await import('../src/jflModernStandings.js');
  const value = mod.jflModernStandingsStyles;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('jflModernStandings.js renderJflModernStandings has a usable type', async () => {
  const mod = await import('../src/jflModernStandings.js');
  const value = mod.renderJflModernStandings;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('jflModernStandings.js routeJflModernStandings has a usable type', async () => {
  const mod = await import('../src/jflModernStandings.js');
  const value = mod.routeJflModernStandings;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('jflModernTeams.js availableTeamApplicationSeasons has a usable type', async () => {
  const mod = await import('../src/jflModernTeams.js');
  const value = mod.availableTeamApplicationSeasons;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('jflModernTeams.js friendlyTeamsError has a usable type', async () => {
  const mod = await import('../src/jflModernTeams.js');
  const value = mod.friendlyTeamsError;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('jflModernTeams.js availableInvitationPlayers has a usable type', async () => {
  const mod = await import('../src/jflModernTeams.js');
  const value = mod.availableInvitationPlayers;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('jflModernTeams.js visibleTeamActions has a usable type', async () => {
  const mod = await import('../src/jflModernTeams.js');
  const value = mod.visibleTeamActions;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('jflModernTeams.js normalizeTeamCards has a usable type', async () => {
  const mod = await import('../src/jflModernTeams.js');
  const value = mod.normalizeTeamCards;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('jflModernTeams.js renderTeamCard has a usable type', async () => {
  const mod = await import('../src/jflModernTeams.js');
  const value = mod.renderTeamCard;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('jflModernTeams.js jflModernTeamsStyles has a usable type', async () => {
  const mod = await import('../src/jflModernTeams.js');
  const value = mod.jflModernTeamsStyles;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('jflModernTeams.js renderJflModernTeams has a usable type', async () => {
  const mod = await import('../src/jflModernTeams.js');
  const value = mod.renderJflModernTeams;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('jflModernTeams.js routeJflModernTeams has a usable type', async () => {
  const mod = await import('../src/jflModernTeams.js');
  const value = mod.routeJflModernTeams;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('jflNotFoundPage.js renderJflNotFoundPage has a usable type', async () => {
  const mod = await import('../src/jflNotFoundPage.js');
  const value = mod.renderJflNotFoundPage;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('jflNotificationsHttp.js createJflNotificationsRoute has a usable type', async () => {
  const mod = await import('../src/jflNotificationsHttp.js');
  const value = mod.createJflNotificationsRoute;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('jflNotificationsHttp.js routeJflNotifications has a usable type', async () => {
  const mod = await import('../src/jflNotificationsHttp.js');
  const value = mod.routeJflNotifications;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('jflNotificationsPage.js renderJflNotificationsPage has a usable type', async () => {
  const mod = await import('../src/jflNotificationsPage.js');
  const value = mod.renderJflNotificationsPage;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('jflPlayersDirectory.js publicDirectoryRows has a usable type', async () => {
  const mod = await import('../src/jflPlayersDirectory.js');
  const value = mod.publicDirectoryRows;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('jflPlayersDirectory.js renderJflPlayersDirectory has a usable type', async () => {
  const mod = await import('../src/jflPlayersDirectory.js');
  const value = mod.renderJflPlayersDirectory;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('jflPlayersDirectory.js routeJflPlayersDirectory has a usable type', async () => {
  const mod = await import('../src/jflPlayersDirectory.js');
  const value = mod.routeJflPlayersDirectory;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('jflProvisionalSeedHttp.js routeJflProvisionalSeed has a usable type', async () => {
  const mod = await import('../src/jflProvisionalSeedHttp.js');
  const value = mod.routeJflProvisionalSeed;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('jflProvisionalSeedHttp.js enhanceJflProvisionalSeedLink has a usable type', async () => {
  const mod = await import('../src/jflProvisionalSeedHttp.js');
  const value = mod.enhanceJflProvisionalSeedLink;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('jflProvisionalSeedPage.js renderJflProvisionalSeedPage has a usable type', async () => {
  const mod = await import('../src/jflProvisionalSeedPage.js');
  const value = mod.renderJflProvisionalSeedPage;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
