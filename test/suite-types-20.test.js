import test from 'node:test';
import assert from 'node:assert/strict';

test('standingsTheme.js standingsThemeStyles has a usable type', async () => {
  const mod = await import('../src/standingsTheme.js');
  const value = mod.standingsThemeStyles;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('standingsTheme.js injectStandingsTheme has a usable type', async () => {
  const mod = await import('../src/standingsTheme.js');
  const value = mod.injectStandingsTheme;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('supabaseAuth.js AuthError has a usable type', async () => {
  const mod = await import('../src/supabaseAuth.js');
  const value = mod.AuthError;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('supabaseAuth.js JFL_SIMULATED_OIDC_ACCESS_TOKEN has a usable type', async () => {
  const mod = await import('../src/supabaseAuth.js');
  const value = mod.JFL_SIMULATED_OIDC_ACCESS_TOKEN;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('supabaseAuth.js JFL_SIMULATED_GOOGLE_TOKEN has a usable type', async () => {
  const mod = await import('../src/supabaseAuth.js');
  const value = mod.JFL_SIMULATED_GOOGLE_TOKEN;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('supabaseAuth.js DRU_AGENT_SENTINEL has a usable type', async () => {
  const mod = await import('../src/supabaseAuth.js');
  const value = mod.DRU_AGENT_SENTINEL;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('supabaseAuth.js isJflSimulatedGoogleToken has a usable type', async () => {
  const mod = await import('../src/supabaseAuth.js');
  const value = mod.isJflSimulatedGoogleToken;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('supabaseAuth.js isDruAgentSentinel has a usable type', async () => {
  const mod = await import('../src/supabaseAuth.js');
  const value = mod.isDruAgentSentinel;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('supabaseAuth.js resolveJflSimulatedGoogleActor has a usable type', async () => {
  const mod = await import('../src/supabaseAuth.js');
  const value = mod.resolveJflSimulatedGoogleActor;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('supabaseAuth.js betaAuthBypassEnabled has a usable type', async () => {
  const mod = await import('../src/supabaseAuth.js');
  const value = mod.betaAuthBypassEnabled;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('supabaseAuth.js jflSimulatedOidcEnabled has a usable type', async () => {
  const mod = await import('../src/supabaseAuth.js');
  const value = mod.jflSimulatedOidcEnabled;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('supabaseAuth.js resolveBetaBypassActor has a usable type', async () => {
  const mod = await import('../src/supabaseAuth.js');
  const value = mod.resolveBetaBypassActor;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('supabaseAuth.js authenticateSupabaseUser has a usable type', async () => {
  const mod = await import('../src/supabaseAuth.js');
  const value = mod.authenticateSupabaseUser;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('supabaseSchema.js expectedSupabaseSchema has a usable type', async () => {
  const mod = await import('../src/supabaseSchema.js');
  const value = mod.expectedSupabaseSchema;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('supabaseSchema.js configuredSupabaseSchema has a usable type', async () => {
  const mod = await import('../src/supabaseSchema.js');
  const value = mod.configuredSupabaseSchema;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('supabaseSchema.js withSupabaseSchema has a usable type', async () => {
  const mod = await import('../src/supabaseSchema.js');
  const value = mod.withSupabaseSchema;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('supabaseSeasonRepository.js createSupabaseSeasonRepository has a usable type', async () => {
  const mod = await import('../src/supabaseSeasonRepository.js');
  const value = mod.createSupabaseSeasonRepository;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('teamCommands.js listOwnTeamManagementCommand has a usable type', async () => {
  const mod = await import('../src/teamCommands.js');
  const value = mod.listOwnTeamManagementCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('teamCommands.js listOwnTeamTradesCommand has a usable type', async () => {
  const mod = await import('../src/teamCommands.js');
  const value = mod.listOwnTeamTradesCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('teamCommands.js createTeamWithCaptainCommand has a usable type', async () => {
  const mod = await import('../src/teamCommands.js');
  const value = mod.createTeamWithCaptainCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('teamCommands.js invitePlayerToTeamCommand has a usable type', async () => {
  const mod = await import('../src/teamCommands.js');
  const value = mod.invitePlayerToTeamCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('teamCommands.js proposeTeamTradeCommand has a usable type', async () => {
  const mod = await import('../src/teamCommands.js');
  const value = mod.proposeTeamTradeCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('teamCommands.js adminProposeTeamTradeExceptionCommand has a usable type', async () => {
  const mod = await import('../src/teamCommands.js');
  const value = mod.adminProposeTeamTradeExceptionCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('teamCommands.js respondToTeamInvitationCommand has a usable type', async () => {
  const mod = await import('../src/teamCommands.js');
  const value = mod.respondToTeamInvitationCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('teamCommands.js respondToTeamTradePlayerCommand has a usable type', async () => {
  const mod = await import('../src/teamCommands.js');
  const value = mod.respondToTeamTradePlayerCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('teamCommands.js approveTeamTradeCaptainCommand has a usable type', async () => {
  const mod = await import('../src/teamCommands.js');
  const value = mod.approveTeamTradeCaptainCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('teamCommands.js cancelTeamInvitationCommand has a usable type', async () => {
  const mod = await import('../src/teamCommands.js');
  const value = mod.cancelTeamInvitationCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('teamCommands.js removeTeamMemberCommand has a usable type', async () => {
  const mod = await import('../src/teamCommands.js');
  const value = mod.removeTeamMemberCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('teamMatchChoiceCommands.js listMyTeamMatchChoicesCommand has a usable type', async () => {
  const mod = await import('../src/teamMatchChoiceCommands.js');
  const value = mod.listMyTeamMatchChoicesCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('teamMatchChoiceCommands.js chooseTeamMatchTeamCommand has a usable type', async () => {
  const mod = await import('../src/teamMatchChoiceCommands.js');
  const value = mod.chooseTeamMatchTeamCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('teamMatchChoiceHttp.js teamMatchChoiceHttpHandlers has a usable type', async () => {
  const mod = await import('../src/teamMatchChoiceHttp.js');
  const value = mod.teamMatchChoiceHttpHandlers;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('teamMatchChoiceRepository.js createTeamMatchChoiceRepository has a usable type', async () => {
  const mod = await import('../src/teamMatchChoiceRepository.js');
  const value = mod.createTeamMatchChoiceRepository;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
