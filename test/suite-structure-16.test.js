import test from 'node:test';
import assert from 'node:assert/strict';

test('standingsCommands.js loads and exports its named members', async () => {
  const mod = await import('../src/standingsCommands.js');
  const expected = ["listTeamStandingsCommand","listIndividualStandingsCommand"];
  for (const name of expected) {
    assert.ok(name in mod, 'standingsCommands.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('standingsCommands.js exports listTeamStandingsCommand as a defined value', async () => {
  const mod = await import('../src/standingsCommands.js');
  assert.notEqual(mod.listTeamStandingsCommand, undefined, 'listTeamStandingsCommand is missing');
});
test('standingsCommands.js exports listIndividualStandingsCommand as a defined value', async () => {
  const mod = await import('../src/standingsCommands.js');
  assert.notEqual(mod.listIndividualStandingsCommand, undefined, 'listIndividualStandingsCommand is missing');
});
test('standingsPage.js loads and exports its named members', async () => {
  const mod = await import('../src/standingsPage.js');
  const expected = ["renderStandingsPage"];
  for (const name of expected) {
    assert.ok(name in mod, 'standingsPage.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('standingsPage.js exports renderStandingsPage as a defined value', async () => {
  const mod = await import('../src/standingsPage.js');
  assert.notEqual(mod.renderStandingsPage, undefined, 'renderStandingsPage is missing');
});
test('standingsRepository.js loads and exports its named members', async () => {
  const mod = await import('../src/standingsRepository.js');
  const expected = ["createStandingsRepository"];
  for (const name of expected) {
    assert.ok(name in mod, 'standingsRepository.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('standingsRepository.js exports createStandingsRepository as a defined value', async () => {
  const mod = await import('../src/standingsRepository.js');
  assert.notEqual(mod.createStandingsRepository, undefined, 'createStandingsRepository is missing');
});
test('standingsTheme.js loads and exports its named members', async () => {
  const mod = await import('../src/standingsTheme.js');
  const expected = ["standingsThemeStyles","injectStandingsTheme"];
  for (const name of expected) {
    assert.ok(name in mod, 'standingsTheme.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('standingsTheme.js exports standingsThemeStyles as a defined value', async () => {
  const mod = await import('../src/standingsTheme.js');
  assert.notEqual(mod.standingsThemeStyles, undefined, 'standingsThemeStyles is missing');
});
test('standingsTheme.js exports injectStandingsTheme as a defined value', async () => {
  const mod = await import('../src/standingsTheme.js');
  assert.notEqual(mod.injectStandingsTheme, undefined, 'injectStandingsTheme is missing');
});
test('supabaseAuth.js loads and exports its named members', async () => {
  const mod = await import('../src/supabaseAuth.js');
  const expected = ["AuthError","JFL_SIMULATED_OIDC_ACCESS_TOKEN","JFL_SIMULATED_GOOGLE_TOKEN","DRU_AGENT_SENTINEL","isJflSimulatedGoogleToken","isDruAgentSentinel","resolveJflSimulatedGoogleActor","betaAuthBypassEnabled","jflSimulatedOidcEnabled","resolveBetaBypassActor","authenticateSupabaseUser"];
  for (const name of expected) {
    assert.ok(name in mod, 'supabaseAuth.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('supabaseAuth.js exports AuthError as a defined value', async () => {
  const mod = await import('../src/supabaseAuth.js');
  assert.notEqual(mod.AuthError, undefined, 'AuthError is missing');
});
test('supabaseAuth.js exports JFL_SIMULATED_OIDC_ACCESS_TOKEN as a defined value', async () => {
  const mod = await import('../src/supabaseAuth.js');
  assert.notEqual(mod.JFL_SIMULATED_OIDC_ACCESS_TOKEN, undefined, 'JFL_SIMULATED_OIDC_ACCESS_TOKEN is missing');
});
test('supabaseAuth.js exports JFL_SIMULATED_GOOGLE_TOKEN as a defined value', async () => {
  const mod = await import('../src/supabaseAuth.js');
  assert.notEqual(mod.JFL_SIMULATED_GOOGLE_TOKEN, undefined, 'JFL_SIMULATED_GOOGLE_TOKEN is missing');
});
test('supabaseAuth.js exports DRU_AGENT_SENTINEL as a defined value', async () => {
  const mod = await import('../src/supabaseAuth.js');
  assert.notEqual(mod.DRU_AGENT_SENTINEL, undefined, 'DRU_AGENT_SENTINEL is missing');
});
test('supabaseAuth.js exports isJflSimulatedGoogleToken as a defined value', async () => {
  const mod = await import('../src/supabaseAuth.js');
  assert.notEqual(mod.isJflSimulatedGoogleToken, undefined, 'isJflSimulatedGoogleToken is missing');
});
test('supabaseAuth.js exports isDruAgentSentinel as a defined value', async () => {
  const mod = await import('../src/supabaseAuth.js');
  assert.notEqual(mod.isDruAgentSentinel, undefined, 'isDruAgentSentinel is missing');
});
test('supabaseAuth.js exports resolveJflSimulatedGoogleActor as a defined value', async () => {
  const mod = await import('../src/supabaseAuth.js');
  assert.notEqual(mod.resolveJflSimulatedGoogleActor, undefined, 'resolveJflSimulatedGoogleActor is missing');
});
test('supabaseAuth.js exports betaAuthBypassEnabled as a defined value', async () => {
  const mod = await import('../src/supabaseAuth.js');
  assert.notEqual(mod.betaAuthBypassEnabled, undefined, 'betaAuthBypassEnabled is missing');
});
test('supabaseAuth.js exports jflSimulatedOidcEnabled as a defined value', async () => {
  const mod = await import('../src/supabaseAuth.js');
  assert.notEqual(mod.jflSimulatedOidcEnabled, undefined, 'jflSimulatedOidcEnabled is missing');
});
test('supabaseAuth.js exports resolveBetaBypassActor as a defined value', async () => {
  const mod = await import('../src/supabaseAuth.js');
  assert.notEqual(mod.resolveBetaBypassActor, undefined, 'resolveBetaBypassActor is missing');
});
test('supabaseAuth.js exports authenticateSupabaseUser as a defined value', async () => {
  const mod = await import('../src/supabaseAuth.js');
  assert.notEqual(mod.authenticateSupabaseUser, undefined, 'authenticateSupabaseUser is missing');
});
test('supabaseSchema.js loads and exports its named members', async () => {
  const mod = await import('../src/supabaseSchema.js');
  const expected = ["expectedSupabaseSchema","configuredSupabaseSchema","withSupabaseSchema"];
  for (const name of expected) {
    assert.ok(name in mod, 'supabaseSchema.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('supabaseSchema.js exports expectedSupabaseSchema as a defined value', async () => {
  const mod = await import('../src/supabaseSchema.js');
  assert.notEqual(mod.expectedSupabaseSchema, undefined, 'expectedSupabaseSchema is missing');
});
test('supabaseSchema.js exports configuredSupabaseSchema as a defined value', async () => {
  const mod = await import('../src/supabaseSchema.js');
  assert.notEqual(mod.configuredSupabaseSchema, undefined, 'configuredSupabaseSchema is missing');
});
test('supabaseSchema.js exports withSupabaseSchema as a defined value', async () => {
  const mod = await import('../src/supabaseSchema.js');
  assert.notEqual(mod.withSupabaseSchema, undefined, 'withSupabaseSchema is missing');
});
test('supabaseSeasonRepository.js loads and exports its named members', async () => {
  const mod = await import('../src/supabaseSeasonRepository.js');
  const expected = ["createSupabaseSeasonRepository"];
  for (const name of expected) {
    assert.ok(name in mod, 'supabaseSeasonRepository.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('supabaseSeasonRepository.js exports createSupabaseSeasonRepository as a defined value', async () => {
  const mod = await import('../src/supabaseSeasonRepository.js');
  assert.notEqual(mod.createSupabaseSeasonRepository, undefined, 'createSupabaseSeasonRepository is missing');
});
test('teamCommands.js loads and exports its named members', async () => {
  const mod = await import('../src/teamCommands.js');
  const expected = ["listOwnTeamManagementCommand","listOwnTeamTradesCommand","createTeamWithCaptainCommand","invitePlayerToTeamCommand","proposeTeamTradeCommand","adminProposeTeamTradeExceptionCommand","respondToTeamInvitationCommand","respondToTeamTradePlayerCommand","approveTeamTradeCaptainCommand","cancelTeamInvitationCommand","removeTeamMemberCommand"];
  for (const name of expected) {
    assert.ok(name in mod, 'teamCommands.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('teamCommands.js exports listOwnTeamManagementCommand as a defined value', async () => {
  const mod = await import('../src/teamCommands.js');
  assert.notEqual(mod.listOwnTeamManagementCommand, undefined, 'listOwnTeamManagementCommand is missing');
});
test('teamCommands.js exports listOwnTeamTradesCommand as a defined value', async () => {
  const mod = await import('../src/teamCommands.js');
  assert.notEqual(mod.listOwnTeamTradesCommand, undefined, 'listOwnTeamTradesCommand is missing');
});
test('teamCommands.js exports createTeamWithCaptainCommand as a defined value', async () => {
  const mod = await import('../src/teamCommands.js');
  assert.notEqual(mod.createTeamWithCaptainCommand, undefined, 'createTeamWithCaptainCommand is missing');
});
test('teamCommands.js exports invitePlayerToTeamCommand as a defined value', async () => {
  const mod = await import('../src/teamCommands.js');
  assert.notEqual(mod.invitePlayerToTeamCommand, undefined, 'invitePlayerToTeamCommand is missing');
});
test('teamCommands.js exports proposeTeamTradeCommand as a defined value', async () => {
  const mod = await import('../src/teamCommands.js');
  assert.notEqual(mod.proposeTeamTradeCommand, undefined, 'proposeTeamTradeCommand is missing');
});
test('teamCommands.js exports adminProposeTeamTradeExceptionCommand as a defined value', async () => {
  const mod = await import('../src/teamCommands.js');
  assert.notEqual(mod.adminProposeTeamTradeExceptionCommand, undefined, 'adminProposeTeamTradeExceptionCommand is missing');
});
test('teamCommands.js exports respondToTeamInvitationCommand as a defined value', async () => {
  const mod = await import('../src/teamCommands.js');
  assert.notEqual(mod.respondToTeamInvitationCommand, undefined, 'respondToTeamInvitationCommand is missing');
});
test('teamCommands.js exports respondToTeamTradePlayerCommand as a defined value', async () => {
  const mod = await import('../src/teamCommands.js');
  assert.notEqual(mod.respondToTeamTradePlayerCommand, undefined, 'respondToTeamTradePlayerCommand is missing');
});
test('teamCommands.js exports approveTeamTradeCaptainCommand as a defined value', async () => {
  const mod = await import('../src/teamCommands.js');
  assert.notEqual(mod.approveTeamTradeCaptainCommand, undefined, 'approveTeamTradeCaptainCommand is missing');
});
test('teamCommands.js exports cancelTeamInvitationCommand as a defined value', async () => {
  const mod = await import('../src/teamCommands.js');
  assert.notEqual(mod.cancelTeamInvitationCommand, undefined, 'cancelTeamInvitationCommand is missing');
});
test('teamCommands.js exports removeTeamMemberCommand as a defined value', async () => {
  const mod = await import('../src/teamCommands.js');
  assert.notEqual(mod.removeTeamMemberCommand, undefined, 'removeTeamMemberCommand is missing');
});
test('teamMatchChoiceCommands.js loads and exports its named members', async () => {
  const mod = await import('../src/teamMatchChoiceCommands.js');
  const expected = ["listMyTeamMatchChoicesCommand","chooseTeamMatchTeamCommand"];
  for (const name of expected) {
    assert.ok(name in mod, 'teamMatchChoiceCommands.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('teamMatchChoiceCommands.js exports listMyTeamMatchChoicesCommand as a defined value', async () => {
  const mod = await import('../src/teamMatchChoiceCommands.js');
  assert.notEqual(mod.listMyTeamMatchChoicesCommand, undefined, 'listMyTeamMatchChoicesCommand is missing');
});
test('teamMatchChoiceCommands.js exports chooseTeamMatchTeamCommand as a defined value', async () => {
  const mod = await import('../src/teamMatchChoiceCommands.js');
  assert.notEqual(mod.chooseTeamMatchTeamCommand, undefined, 'chooseTeamMatchTeamCommand is missing');
});
test('teamMatchChoiceHttp.js loads and exports its named members', async () => {
  const mod = await import('../src/teamMatchChoiceHttp.js');
  const expected = ["teamMatchChoiceHttpHandlers"];
  for (const name of expected) {
    assert.ok(name in mod, 'teamMatchChoiceHttp.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('teamMatchChoiceHttp.js exports teamMatchChoiceHttpHandlers as a defined value', async () => {
  const mod = await import('../src/teamMatchChoiceHttp.js');
  assert.notEqual(mod.teamMatchChoiceHttpHandlers, undefined, 'teamMatchChoiceHttpHandlers is missing');
});
