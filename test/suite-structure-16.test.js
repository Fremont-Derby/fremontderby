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
test('standingsPage.js loads and exports its named members', async () => {
  const mod = await import('../src/standingsPage.js');
  const expected = ["renderStandingsPage"];
  for (const name of expected) {
    assert.ok(name in mod, 'standingsPage.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('standingsRepository.js loads and exports its named members', async () => {
  const mod = await import('../src/standingsRepository.js');
  const expected = ["createStandingsRepository"];
  for (const name of expected) {
    assert.ok(name in mod, 'standingsRepository.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('standingsTheme.js loads and exports its named members', async () => {
  const mod = await import('../src/standingsTheme.js');
  const expected = ["standingsThemeStyles","injectStandingsTheme"];
  for (const name of expected) {
    assert.ok(name in mod, 'standingsTheme.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('supabaseAuth.js loads and exports its named members', async () => {
  const mod = await import('../src/supabaseAuth.js');
  const expected = ["AuthError","JFL_SIMULATED_OIDC_ACCESS_TOKEN","JFL_SIMULATED_GOOGLE_TOKEN","DRU_AGENT_SENTINEL","isJflSimulatedGoogleToken","isDruAgentSentinel","resolveJflSimulatedGoogleActor","betaAuthBypassEnabled","jflSimulatedOidcEnabled","resolveBetaBypassActor","authenticateSupabaseUser"];
  for (const name of expected) {
    assert.ok(name in mod, 'supabaseAuth.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('supabaseSchema.js loads and exports its named members', async () => {
  const mod = await import('../src/supabaseSchema.js');
  const expected = ["expectedSupabaseSchema","configuredSupabaseSchema","withSupabaseSchema"];
  for (const name of expected) {
    assert.ok(name in mod, 'supabaseSchema.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('supabaseSeasonRepository.js loads and exports its named members', async () => {
  const mod = await import('../src/supabaseSeasonRepository.js');
  const expected = ["createSupabaseSeasonRepository"];
  for (const name of expected) {
    assert.ok(name in mod, 'supabaseSeasonRepository.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('teamCommands.js loads and exports its named members', async () => {
  const mod = await import('../src/teamCommands.js');
  const expected = ["listOwnTeamManagementCommand","listOwnTeamTradesCommand","createTeamWithCaptainCommand","invitePlayerToTeamCommand","proposeTeamTradeCommand","adminProposeTeamTradeExceptionCommand","respondToTeamInvitationCommand","respondToTeamTradePlayerCommand","approveTeamTradeCaptainCommand","cancelTeamInvitationCommand","removeTeamMemberCommand"];
  for (const name of expected) {
    assert.ok(name in mod, 'teamCommands.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('teamMatchChoiceCommands.js loads and exports its named members', async () => {
  const mod = await import('../src/teamMatchChoiceCommands.js');
  const expected = ["listMyTeamMatchChoicesCommand","chooseTeamMatchTeamCommand"];
  for (const name of expected) {
    assert.ok(name in mod, 'teamMatchChoiceCommands.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('teamMatchChoiceHttp.js loads and exports its named members', async () => {
  const mod = await import('../src/teamMatchChoiceHttp.js');
  const expected = ["teamMatchChoiceHttpHandlers"];
  for (const name of expected) {
    assert.ok(name in mod, 'teamMatchChoiceHttp.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
