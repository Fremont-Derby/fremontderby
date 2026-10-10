import test from 'node:test';
import assert from 'node:assert/strict';

test('adminSeasonTeamsRouter.js routeAdminSeasonTeams has a usable type', async () => {
  const mod = await import('../src/adminSeasonTeamsRouter.js');
  const value = mod.routeAdminSeasonTeams;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('adminSeasonsPage.js renderAdminSeasonsPage has a usable type', async () => {
  const mod = await import('../src/adminSeasonsPage.js');
  const value = mod.renderAdminSeasonsPage;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('adminSurfaceTheme.js adminSurfaceThemeStyles has a usable type', async () => {
  const mod = await import('../src/adminSurfaceTheme.js');
  const value = mod.adminSurfaceThemeStyles;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('adminSurfaceTheme.js injectAdminSurfaceTheme has a usable type', async () => {
  const mod = await import('../src/adminSurfaceTheme.js');
  const value = mod.injectAdminSurfaceTheme;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('appShell.js friendlyErrorMessage has a usable type', async () => {
  const mod = await import('../src/appShell.js');
  const value = mod.friendlyErrorMessage;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('appShell.js renderPrimaryNavigation has a usable type', async () => {
  const mod = await import('../src/appShell.js');
  const value = mod.renderPrimaryNavigation;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('appShell.js shellStyles has a usable type', async () => {
  const mod = await import('../src/appShell.js');
  const value = mod.shellStyles;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('appShell.js decorateHtmlWithShell has a usable type', async () => {
  const mod = await import('../src/appShell.js');
  const value = mod.decorateHtmlWithShell;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('appShell.js isKnownAppPagePath has a usable type', async () => {
  const mod = await import('../src/appShell.js');
  const value = mod.isKnownAppPagePath;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('appShell.js renderNotFoundPage has a usable type', async () => {
  const mod = await import('../src/appShell.js');
  const value = mod.renderNotFoundPage;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('availabilityCommands.js setRosterAvailabilityCommand has a usable type', async () => {
  const mod = await import('../src/availabilityCommands.js');
  const value = mod.setRosterAvailabilityCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('availabilityCommands.js listTeamRoundAvailabilityCommand has a usable type', async () => {
  const mod = await import('../src/availabilityCommands.js');
  const value = mod.listTeamRoundAvailabilityCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('availabilityPage.js renderAvailabilityPage has a usable type', async () => {
  const mod = await import('../src/availabilityPage.js');
  const value = mod.renderAvailabilityPage;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('availabilityPageCore.js renderAvailabilityPage has a usable type', async () => {
  const mod = await import('../src/availabilityPageCore.js');
  const value = mod.renderAvailabilityPage;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('availabilityRepository.js createAvailabilityRepository has a usable type', async () => {
  const mod = await import('../src/availabilityRepository.js');
  const value = mod.createAvailabilityRepository;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
