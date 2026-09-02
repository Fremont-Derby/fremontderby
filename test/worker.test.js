import test from "node:test";
import assert from "node:assert/strict";
import worker, {
  handleAdminProposeTeamTradeExceptionRequest,
  handleApproveTeamTradeCaptainRequest,
  handleCancelTeamInvitationRequest,
  handleCorrectPlayerMatchRequest,
  handleCreateTeamRequest,
  handleFinalizePlayerMatchRequest,
  handleGetOwnProfileRequest,
  handleGetPlayerMatchScorecardRequest,
  handleInvitePlayerToTeamRequest,
  handleListEligibleFreeAgentsRequest,
  handleListAdminSeasonsRequest,
  handleListIndividualStandingsRequest,
  handleListPublicSeasonsRequest,
  handleListTeamRoundAvailabilityRequest,
  handleListTeamStandingsRequest,
  handleListOwnTeamManagementRequest,
  handleListVisibleTeamLineupsRequest,
  handleConfigureSeasonPrizesRequest,
  handleCreateSeasonSetupRequest,
  handleFinalizeSeasonPrizePayoutsRequest,
  handleGetSeasonSetupRequest,
  handleGetSeasonPrizeSummaryRequest,
  handlePublishScheduleRequest,
  handleUpdateSeasonSetupRequest,
  handleListOwnTeamTradesRequest,
  handleProposeTeamTradeRequest,
  handleRegisterFreeAgentRequest,
  handleRemoveTeamMemberRequest,
  handleRespondToTeamTradePlayerRequest,
  handleRespondToTeamInvitationRequest,
  handleSaveOwnProfileRequest,
  handleSetFreeAgentAvailabilityRequest,
  handleSetRosterAvailabilityRequest,
  handleSubmitTeamLineupRequest,
  handleRecordPlayerMatchRackRequest,
  handleUndoPlayerMatchRackRequest,
  renderLandingPage,
} from "../src/index.js";

const env = {
  CF_VERSION_METADATA: {
    id: "test-version-123",
    tag: "test",
    timestamp: "2026-08-09T23:40:00Z",
  },
};

const publishEnv = {
  ...env,
  SUPABASE_URL: "https://project.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "publishable-key",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
};

const productionReadyEnv = {
  ...env,
  ENVIRONMENT: "production",
  SUPABASE_URL: "https://cpiucsxlkicmlbvdvhww.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "publishable-key",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
};

const seasonTeams = Array.from({ length: 8 }, (_, index) => ({
  id: `00000000-0000-0000-0000-${String(index + 1).padStart(12, "0")}`,
}));

function createFetch(responses) {
  const calls = [];

  const fetch = async (url, init) => {
    calls.push({ url, init });
    const response = responses.shift();
    return new Response(
      response.body === undefined ? null : JSON.stringify(response.body),
      {
        status: response.status ?? 200,
        headers: { "content-type": "application/json" },
      },
    );
  };

  return { fetch, calls };
}

test("landing page identifies Fremont Derby and deployed version", () => {
  const html = renderLandingPage(env);
  assert.match(html, /Fremont Derby/);
  assert.match(html, /test-version-123/);
});

test("health endpoint reports service and Worker version", async () => {
  const response = await worker.fetch(new Request("https://fremontderby.com/health"), env);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), {
    ok: true,
    service: "fremontderby",
    version: "test-version-123",
    versionTag: "test",
    deployedAt: "2026-08-09T23:40:00Z",
  });
});

test("environment health endpoint reports ready production Supabase bindings", async () => {
  const response = await worker.fetch(
    new Request("https://fremontderby.com/health/environment"),
    productionReadyEnv,
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.environment, "production");
  // Public payload stays coarse — no project refs or key-presence flags
  assert.equal(body.expectedSupabaseProjectRef, undefined);
  assert.equal(body.supabase, undefined);
  assert.doesNotMatch(JSON.stringify(body), /service-role-key/);
  // Project ref may appear in structured checks; keys must never leak.
  assert.equal(body.supabase, undefined);
});

test("environment health endpoint fails when production Supabase bindings are missing", async () => {
  const response = await worker.fetch(
    new Request("https://fremontderby.com/health/environment"),
    env,
  );

  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.ok, false);
  assert.equal(body.environment, "production");
  assert.equal(body.supabase, undefined);
});

test("scorecard page route returns the phone scorecard UI", async () => {
  const response = await worker.fetch(
    new Request("https://fremontderby.com/scorecard?match=player-match-1"),
    publishEnv,
  );

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /text\/html/);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const html = await response.text();
  assert.match(html, /Fremont Derby Scorecard/);
  assert.match(html, /data-rack-a/);
  assert.match(html, /data-finalize/);
});

test("scorecard page route allows only GET", async () => {
  const response = await worker.fetch(
    new Request("https://fremontderby.com/scorecard", { method: "POST" }),
    publishEnv,
  );

  assert.equal(response.status, 405);
  assert.deepEqual(await response.json(), { error: "Method not allowed" });
});

test("standings page route returns the public standings UI", async () => {
  const response = await worker.fetch(
    new Request("https://fremontderby.com/standings?season=season-1"),
    publishEnv,
  );

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /text\/html/);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const html = await response.text();
  assert.match(html, /Fremont Derby Standings/);
  assert.match(html, /data-team-body/);
  assert.match(html, /data-player-body/);
});

test("standings page route allows only GET", async () => {
  const response = await worker.fetch(
    new Request("https://fremontderby.com/standings", { method: "POST" }),
    publishEnv,
  );

  assert.equal(response.status, 405);
  assert.deepEqual(await response.json(), { error: "Method not allowed" });
});

test("prizes page route returns the public prize-purse UI", async () => {
  const response = await worker.fetch(
    new Request("https://fremontderby.com/prizes?season=season-1"),
    publishEnv,
  );

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /text\/html/);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const html = await response.text();
  assert.match(html, /Fremont Derby Prizes/);
  assert.match(html, /data-player-count/);
  assert.match(html, /data-projected-body/);
});

test("prizes page route allows only GET", async () => {
  const response = await worker.fetch(
    new Request("https://fremontderby.com/prizes", { method: "POST" }),
    publishEnv,
  );

  assert.equal(response.status, 405);
  assert.deepEqual(await response.json(), { error: "Method not allowed" });
});

test("season setup page route returns the director setup UI", async () => {
  const response = await worker.fetch(
    new Request("https://fremontderby.com/season-setup?season=season-1"),
    publishEnv,
  );

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /text\/html/);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const html = await response.text();
  assert.match(html, /Fremont Derby Season Setup/);
  assert.match(html, /data-season-setup-form/);
  assert.match(html, /publish-schedule/);
});

test("season setup page route allows only GET", async () => {
  const response = await worker.fetch(
    new Request("https://fremontderby.com/season-setup", { method: "POST" }),
    publishEnv,
  );

  assert.equal(response.status, 405);
  assert.deepEqual(await response.json(), { error: "Method not allowed" });
});

test("lineup page route returns the captain lineup UI", async () => {
  const response = await worker.fetch(
    new Request("https://fremontderby.com/lineup?team=team-1&round=round-1"),
    publishEnv,
  );

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /text\/html/);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const html = await response.text();
  assert.match(html, /Fremont Derby Lineup/);
  assert.match(html, /data-availability-body/);
  assert.match(html, /data-submit/);
});

test("lineup page route allows only GET", async () => {
  const response = await worker.fetch(
    new Request("https://fremontderby.com/lineup", { method: "POST" }),
    publishEnv,
  );

  assert.equal(response.status, 405);
  assert.deepEqual(await response.json(), { error: "Method not allowed" });
});

test("profile page route returns the sign-in profile UI", async () => {
  const response = await worker.fetch(
    new Request("https://fremontderby.com/profile"),
    publishEnv,
  );

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /text\/html/);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const html = await response.text();
  assert.match(html, /Fremont Derby Profile/);
  assert.match(html, /data-auth-form/);
  assert.match(html, /\/api\/me\/profile/);
  assert.match(html, /publishable-key/);
  assert.doesNotMatch(html, /service-role-key/);
});

test("profile page route allows only GET", async () => {
  const response = await worker.fetch(
    new Request("https://fremontderby.com/profile", { method: "POST" }),
    publishEnv,
  );

  assert.equal(response.status, 405);
  assert.deepEqual(await response.json(), { error: "Method not allowed" });
});

test("availability page route returns the player availability UI", async () => {
  const response = await worker.fetch(new Request("https://fremontderby.com/availability"), publishEnv);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /availability/i);
  assert.match(html, /Fremont Derby/i);
});

test("availability page route allows only GET", async () => {
  const response = await worker.fetch(
    new Request("https://fremontderby.com/availability", { method: "POST" }),
    publishEnv,
  );

  assert.equal(response.status, 405);
  assert.deepEqual(await response.json(), { error: "Method not allowed" });
});

test("teams page route returns the team management UI", async () => {
  const response = await worker.fetch(
    new Request("https://fremontderby.com/teams?season=season-1"),
    publishEnv,
  );

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /text\/html/);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const html = await response.text();
  assert.match(html, /Fremont Derby Teams/);
  assert.match(html, /data-captain-teams/);
  assert.match(html, /data-invitations/);
});

test("teams page route allows only GET", async () => {
  const response = await worker.fetch(
    new Request("https://fremontderby.com/teams", { method: "POST" }),
    publishEnv,
  );

  assert.equal(response.status, 405);
  assert.deepEqual(await response.json(), { error: "Method not allowed" });
});

test("trades page route returns the trade management UI", async () => {
  const response = await worker.fetch(new Request("https://fremontderby.com/trades"), publishEnv);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Trades/i);
  assert.match(html, /Fremont Derby/i);
});

test("trades page route allows only GET", async () => {
  const response = await worker.fetch(
    new Request("https://fremontderby.com/trades", { method: "POST" }),
    publishEnv,
  );

  assert.equal(response.status, 405);
  assert.deepEqual(await response.json(), { error: "Method not allowed" });
});

test("publish schedule handler authenticates and calls the trusted repository path", async () => {
  const { fetch, calls } = createFetch([
    { body: { id: "admin-user-1", email: "admin@example.com" } },
    { body: [{ id: "season-1", status: "draft" }] },
    { body: seasonTeams },
    { body: [{ round_count: 7, team_match_count: 28 }] },
  ]);
  const request = new Request(
    "https://fremontderby.com/api/admin/seasons/season-1/publish-schedule",
    {
      method: "POST",
      headers: { authorization: "Bearer user-token" },
      body: JSON.stringify({
        firstRoundDate: "2026-09-03",
        tableNumbers: [1, 2, 3, 4],
      }),
    },
  );

  const response = await handlePublishScheduleRequest(
    request,
    publishEnv,
    "season-1",
    { fetch },
  );

  assert.equal(response.status, 201);
  const body = await response.json();
  assert.equal(body.status, "active");
  assert.equal(body.roundCount, 7);
  assert.equal(body.teamMatchCount, 28);
  assert.deepEqual(body.saved, { round_count: 7, team_match_count: 28 });

  assert.equal(calls[0].url, "https://project.supabase.co/auth/v1/user");
  assert.equal(calls[0].init.headers.apikey, "publishable-key");
  assert.equal(calls[0].init.headers.authorization, "Bearer user-token");
  assert.equal(calls[3].url, "https://project.supabase.co/rest/v1/rpc/publish_season_schedule");
  assert.equal(calls[3].init.headers.apikey, "service-role-key");

  const rpcBody = JSON.parse(calls[3].init.body);
  assert.equal(rpcBody.actor_user_id, "admin-user-1");
  assert.equal(rpcBody.target_season_id, "season-1");
  assert.equal(rpcBody.rounds_payload.length, 7);
  assert.equal(
    rpcBody.rounds_payload.reduce((total, round) => total + round.matches.length, 0),
    28,
  );
});

test("publish schedule handler rejects missing bearer token before Supabase calls", async () => {
  const { fetch, calls } = createFetch([]);
  const request = new Request(
    "https://fremontderby.com/api/admin/seasons/season-1/publish-schedule",
    {
      method: "POST",
      body: JSON.stringify({ firstRoundDate: "2026-09-03" }),
    },
  );

  const response = await handlePublishScheduleRequest(
    request,
    publishEnv,
    "season-1",
    { fetch },
  );

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "Missing bearer token" });
  assert.equal(calls.length, 0);
});

test("publish schedule route requires POST", async () => {
  const response = await worker.fetch(
    new Request("https://fremontderby.com/api/admin/seasons/season-1/publish-schedule"),
    publishEnv,
  );

  assert.equal(response.status, 405);
  assert.deepEqual(await response.json(), { error: "Method not allowed" });
});

test("publish schedule handler can use saved season setup defaults", async () => {
  const { fetch, calls } = createFetch([
    { body: { id: "admin-user-1", email: "admin@example.com" } },
    {
      body: [{
        id: "season-1",
        status: "registration",
        first_round_date: "2026-09-03",
        round_interval_days: 14,
        default_table_numbers: [5, 6, 7, 8],
      }],
    },
    { body: seasonTeams },
    { body: [{ round_count: 7, team_match_count: 28 }] },
  ]);
  const request = new Request(
    "https://fremontderby.com/api/admin/seasons/season-1/publish-schedule",
    {
      method: "POST",
      headers: { authorization: "Bearer admin-token" },
      body: "{}",
    },
  );

  const response = await handlePublishScheduleRequest(
    request,
    publishEnv,
    "season-1",
    { fetch },
  );

  assert.equal(response.status, 201);
  const rpcBody = JSON.parse(calls[3].init.body);
  assert.deepEqual(
    rpcBody.rounds_payload[0].matches.map((match) => match.tableNumber),
    [5, 6, 7, 8],
  );
  assert.deepEqual(
    rpcBody.rounds_payload.slice(0, 2).map((round) => round.scheduledOn),
    ["2026-09-03", "2026-09-17"],
  );
});

test("season setup create handler authenticates and saves setup", async () => {
  const { fetch, calls } = createFetch([
    { body: { id: "admin-user-1", email: "admin@example.com" } },
    {
      body: [{
        id: "season-1",
        name: "Fremont Derby Season 1",
        status: "registration",
      }],
    },
  ]);
  const request = new Request("https://fremontderby.com/api/admin/seasons", {
    method: "POST",
    headers: { authorization: "Bearer admin-token" },
    body: JSON.stringify({
      seasonName: "Fremont Derby Season 1",
      leagueNight: "Thursday",
      firstRoundDate: "2026-09-03",
      rosterLockRound: 5,
      openingBlockLength: 3,
      individualMinMatches: 5,
      roundIntervalDays: 7,
      tableNumbers: [1, 2, 3, 4],
      raceChartVersion: "season-1-default",
      playoffTeamCount: 4,
      playoffAnchorTiebreaker: true,
    }),
  });

  const response = await handleCreateSeasonSetupRequest(
    request,
    publishEnv,
    { fetch },
  );

  assert.equal(response.status, 201);
  assert.equal((await response.json()).setup.id, "season-1");
  assert.equal(calls[0].url, "https://project.supabase.co/auth/v1/user");
  assert.equal(calls[1].url, "https://project.supabase.co/rest/v1/rpc/configure_season_setup");
  assert.deepEqual(JSON.parse(calls[1].init.body), {
    actor_user_id: "admin-user-1",
    target_season_id: null,
    configured_season_name: "Fremont Derby Season 1",
    configured_league_night: "Thursday",
    configured_first_round_date: "2026-09-03",
    configured_roster_lock_round: 5,
    configured_opening_block_length: 3,
    configured_individual_min_matches: 5,
    configured_round_interval_days: 7,
    configured_table_numbers: [1, 2, 3, 4],
    configured_race_chart_version: "season-1-default",
    configured_playoff_team_count: 4,
    configured_playoff_anchor_tiebreaker: true,
  });
});

test("season setup read handler returns teams and published rounds", async () => {
  const { fetch, calls } = createFetch([
    { body: { id: "admin-user-1", email: "admin@example.com" } },
    {
      body: [{
        id: "season-1",
        name: "Fremont Derby Season 1",
        teams: [{ teamName: "Breakers", activeRosterCount: 4 }],
        rounds: [{ roundNumber: 1, matches: [{ tableNumber: 1 }] }],
      }],
    },
  ]);
  const request = new Request("https://fremontderby.com/api/admin/seasons/season-1/setup", {
    headers: { authorization: "Bearer admin-token" },
  });

  const response = await handleGetSeasonSetupRequest(
    request,
    publishEnv,
    "season-1",
    { fetch },
  );

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.setup.teams[0].teamName, "Breakers");
  assert.equal(body.setup.rounds[0].roundNumber, 1);
  assert.equal(calls[1].url, "https://project.supabase.co/rest/v1/rpc/get_season_setup");
  assert.deepEqual(JSON.parse(calls[1].init.body), {
    actor_user_id: "admin-user-1",
    target_season_id: "season-1",
  });
});

test("season setup update handler authenticates and updates setup", async () => {
  const { fetch, calls } = createFetch([
    { body: { id: "admin-user-1", email: "admin@example.com" } },
    {
      body: [{
        id: "season-1",
        name: "Fremont Derby Season 1",
        league_night: "Wednesday",
      }],
    },
  ]);
  const request = new Request("https://fremontderby.com/api/admin/seasons/season-1/setup", {
    method: "PUT",
    headers: { authorization: "Bearer admin-token" },
    body: JSON.stringify({
      seasonName: "Fremont Derby Season 1",
      leagueNight: "Wednesday",
      firstRoundDate: "2026-09-03",
      rosterLockRound: 5,
      openingBlockLength: 3,
      individualMinMatches: 5,
      roundIntervalDays: 7,
      tableNumbers: [1, 2, 3, 4],
      raceChartVersion: "season-1-default",
      playoffTeamCount: 4,
      playoffAnchorTiebreaker: false,
    }),
  });

  const response = await handleUpdateSeasonSetupRequest(
    request,
    publishEnv,
    "season-1",
    { fetch },
  );

  assert.equal(response.status, 200);
  assert.equal((await response.json()).setup.league_night, "Wednesday");
  assert.equal(calls[1].url, "https://project.supabase.co/rest/v1/rpc/configure_season_setup");
  assert.equal(JSON.parse(calls[1].init.body).target_season_id, "season-1");
  assert.equal(JSON.parse(calls[1].init.body).configured_playoff_anchor_tiebreaker, false);
});

test("season setup routes enforce supported methods", async () => {
  const createResponse = await worker.fetch(
    new Request("https://fremontderby.com/api/admin/seasons", { method: "DELETE" }),
    publishEnv,
  );
  const setupResponse = await worker.fetch(
    new Request("https://fremontderby.com/api/admin/seasons/season-1/setup", { method: "POST" }),
    publishEnv,
  );

  assert.equal(createResponse.status, 405);
  assert.equal(setupResponse.status, 405);
});

test("own profile handler returns the authenticated player's profile", async () => {
  const { fetch, calls } = createFetch([
    { body: { id: "user-1", email: "player@example.com" } },
    {
      body: [{
        id: "player-1",
        user_id: "user-1",
        display_name: "Kai",
        fargo_rating: 531,
        rating_status: "established",
        teams: [{ seasonName: "Fall 2026", teamName: "Breakers", role: "captain" }],
        seasons: [{ seasonName: "Fall 2026", participationType: "team", status: "active" }],
      }],
    },
  ]);
  const request = new Request("https://fremontderby.com/api/me/profile", {
    headers: { authorization: "Bearer user-token" },
  });

  const response = await handleGetOwnProfileRequest(request, publishEnv, { fetch });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    profile: {
      id: "player-1",
      user_id: "user-1",
      display_name: "Kai",
      fargo_rating: 531,
      rating_status: "established",
      teams: [{ seasonName: "Fall 2026", teamName: "Breakers", role: "captain" }],
      seasons: [{ seasonName: "Fall 2026", participationType: "team", status: "active" }],
    },
  });
  assert.equal(calls[0].url, "https://project.supabase.co/auth/v1/user");
  assert.equal(calls[1].url, "https://project.supabase.co/rest/v1/rpc/get_own_player_profile");
  assert.deepEqual(JSON.parse(calls[1].init.body), {
    actor_user_id: "user-1",
  });
});

test("own profile handler saves the authenticated player's display name", async () => {
  const { fetch, calls } = createFetch([
    { body: { id: "user-1", email: "player@example.com" } },
    { body: [{ id: "player-1", user_id: "user-1", display_name: "Kai B" }] },
  ]);
  const request = new Request("https://fremontderby.com/api/me/profile", {
    method: "PUT",
    headers: { authorization: "Bearer user-token" },
    body: JSON.stringify({ displayName: "  Kai B  " }),
  });

  const response = await handleSaveOwnProfileRequest(request, publishEnv, { fetch });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    profile: { id: "player-1", user_id: "user-1", display_name: "Kai B" },
  });
  assert.equal(calls[1].url, "https://project.supabase.co/rest/v1/rpc/upsert_player_profile");
  assert.equal(calls[1].init.headers.apikey, "service-role-key");
  assert.deepEqual(JSON.parse(calls[1].init.body), {
    actor_user_id: "user-1",
    profile_display_name: "Kai B",
    profile_fargo_external_id: null,
  });
});

test("own profile route allows only GET and PUT", async () => {
  const response = await worker.fetch(
    new Request("https://fremontderby.com/api/me/profile", { method: "POST" }),
    publishEnv,
  );

  assert.equal(response.status, 405);
  assert.deepEqual(await response.json(), { error: "Method not allowed" });
});

test("own team management handler returns captained teams and invitations", async () => {
  const { fetch, calls } = createFetch([
    { body: { id: "user-1", email: "captain@example.com" } },
    {
      body: [{
        player_id: "player-1",
        captain_teams: [{ teamName: "Breakers" }],
        invitations: [{ teamName: "Rack Pack" }],
      }],
    },
  ]);
  const request = new Request("https://fremontderby.com/api/me/teams", {
    headers: { authorization: "Bearer user-token" },
  });

  const response = await handleListOwnTeamManagementRequest(request, publishEnv, { fetch });

  assert.equal(response.status, 200);
  const managementBody = await response.json();
  assert.equal(managementBody.teamManagement.player_id, "player-1");
  assert.equal(managementBody.teamManagement.captain_teams[0].teamName, "Breakers");
  assert.ok(Array.isArray(managementBody.teamManagement.captain_teams[0].members));
  assert.ok(Array.isArray(managementBody.teamManagement.captain_teams[0].roster));
  assert.equal(managementBody.teamManagement.invitations[0].teamName, "Rack Pack");
  assert.ok(Array.isArray(managementBody.teamManagement.applications));
  assert.ok(Array.isArray(managementBody.teamManagement.returning_slots));
  assert.equal(calls[0].url, "https://project.supabase.co/auth/v1/user");
  assert.equal(calls[1].url, "https://project.supabase.co/rest/v1/rpc/get_own_team_management");
  assert.deepEqual(JSON.parse(calls[1].init.body), {
    actor_user_id: "user-1",
  });
});

test("own team management route allows only GET", async () => {
  const response = await worker.fetch(
    new Request("https://fremontderby.com/api/me/teams", { method: "POST" }),
    publishEnv,
  );

  assert.equal(response.status, 405);
  assert.deepEqual(await response.json(), { error: "Method not allowed" });
});

test("own team trades handler returns visible player and captain trades", async () => {
  const { fetch, calls } = createFetch([
    { body: { id: "user-1", email: "captain@example.com" } },
    {
      body: [{
        player_id: "player-1",
        trades: [{
          tradeId: "trade-1",
          status: "pending",
          requestingTeamName: "Breakers",
          requestedTeamName: "Rack Pack",
        }],
      }],
    },
  ]);
  const request = new Request("https://fremontderby.com/api/me/trades", {
    headers: { authorization: "Bearer user-token" },
  });

  const response = await handleListOwnTeamTradesRequest(request, publishEnv, { fetch });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    tradeManagement: {
      player_id: "player-1",
      trades: [{
        tradeId: "trade-1",
        status: "pending",
        requestingTeamName: "Breakers",
        requestedTeamName: "Rack Pack",
      }],
    },
  });
  assert.equal(calls[0].url, "https://project.supabase.co/auth/v1/user");
  assert.equal(calls[1].url, "https://project.supabase.co/rest/v1/rpc/get_own_team_trades");
  assert.deepEqual(JSON.parse(calls[1].init.body), {
    actor_user_id: "user-1",
  });
});

test("own team trades route allows only GET", async () => {
  const response = await worker.fetch(
    new Request("https://fremontderby.com/api/me/trades", { method: "POST" }),
    publishEnv,
  );

  assert.equal(response.status, 405);
  assert.deepEqual(await response.json(), { error: "Method not allowed" });
});

test("team application handler authenticates and submits for admin review", async () => {
  const { fetch, calls } = createFetch([
    { body: { id: "user-1", email: "player@example.com" } },
    {
      body: [{
        id: "application-1",
        season_id: "season-1",
        status: "applied",
        team_name: "Breakers",
      }],
    },
  ]);
  const request = new Request("https://fremontderby.com/api/seasons/season-1/teams", {
    method: "POST",
    headers: { authorization: "Bearer user-token" },
    body: JSON.stringify({ teamName: "  Breakers  " }),
  });

  const response = await handleCreateTeamRequest(
    request,
    publishEnv,
    "season-1",
    { fetch },
  );

  assert.equal(response.status, 202);
  assert.deepEqual(await response.json(), {
    application: {
      id: "application-1",
      season_id: "season-1",
      status: "applied",
      team_name: "Breakers",
    },
  });
  assert.equal(calls[0].url, "https://project.supabase.co/auth/v1/user");
  assert.equal(calls[1].url, "https://project.supabase.co/rest/v1/rpc/submit_team_application");
  assert.deepEqual(JSON.parse(calls[1].init.body), {
    actor_user_id: "user-1",
    target_season_id: "season-1",
    proposed_team_name: "Breakers",
  });
});

test("team creation route requires POST", async () => {
  const response = await worker.fetch(
    new Request("https://fremontderby.com/api/seasons/season-1/teams"),
    publishEnv,
  );

  assert.equal(response.status, 405);
  assert.deepEqual(await response.json(), { error: "Method not allowed" });
});

test("team invitation handler authenticates and invites a player", async () => {
  const { fetch, calls } = createFetch([
    { body: { id: "captain-user-1", email: "captain@example.com" } },
    {
      body: [{
        id: "invitation-1",
        season_id: "season-1",
        team_id: "team-1",
        invited_player_id: "player-2",
        status: "pending",
      }],
    },
  ]);
  const request = new Request("https://fremontderby.com/api/teams/team-1/invitations", {
    method: "POST",
    headers: { authorization: "Bearer captain-token" },
    body: JSON.stringify({ playerId: "player-2" }),
  });

  const response = await handleInvitePlayerToTeamRequest(
    request,
    publishEnv,
    "team-1",
    { fetch },
  );

  assert.equal(response.status, 201);
  assert.equal((await response.json()).invitation.status, "pending");
  assert.equal(calls[1].url, "https://project.supabase.co/rest/v1/rpc/invite_player_to_team");
  assert.deepEqual(JSON.parse(calls[1].init.body), {
    actor_user_id: "captain-user-1",
    target_team_id: "team-1",
    target_player_id: "player-2",
  });
});

test("team trade proposal handler authenticates and creates a pending trade", async () => {
  const { fetch, calls } = createFetch([
    { body: { id: "captain-user-1", email: "captain@example.com" } },
    {
      body: [{
        id: "trade-1",
        season_id: "season-1",
        requesting_team_id: "team-1",
        requested_team_id: "team-2",
        offered_player_id: "player-1",
        requested_player_id: "player-2",
        status: "pending",
        admin_exception: false,
      }],
    },
  ]);
  const request = new Request("https://fremontderby.com/api/teams/team-1/trades", {
    method: "POST",
    headers: { authorization: "Bearer captain-token" },
    body: JSON.stringify({
      offeredPlayerId: "player-1",
      requestedTeamId: "team-2",
      requestedPlayerId: "player-2",
    }),
  });

  const response = await handleProposeTeamTradeRequest(
    request,
    publishEnv,
    "team-1",
    { fetch },
  );

  assert.equal(response.status, 201);
  assert.equal((await response.json()).trade.status, "pending");
  assert.equal(calls[1].url, "https://project.supabase.co/rest/v1/rpc/propose_team_trade");
  assert.deepEqual(JSON.parse(calls[1].init.body), {
    actor_user_id: "captain-user-1",
    actor_team_id: "team-1",
    offered_roster_player_id: "player-1",
    requested_roster_team_id: "team-2",
    requested_roster_player_id: "player-2",
  });
});

test("team trade proposal handler treats roster lock as a conflict", async () => {
  const { fetch } = createFetch([
    { body: { id: "captain-user-1", email: "captain@example.com" } },
    { status: 400, body: { message: "Roster lock has passed; admin exception required" } },
  ]);
  const request = new Request("https://fremontderby.com/api/teams/team-1/trades", {
    method: "POST",
    headers: { authorization: "Bearer captain-token" },
    body: JSON.stringify({
      offeredPlayerId: "player-1",
      requestedTeamId: "team-2",
      requestedPlayerId: "player-2",
    }),
  });

  const response = await handleProposeTeamTradeRequest(
    request,
    publishEnv,
    "team-1",
    { fetch },
  );

  assert.equal(response.status, 409);
  assert.deepEqual(await response.json(), {
    error: "Roster lock has passed; admin exception required",
  });
});

test("admin trade exception handler authenticates an admin proposal", async () => {
  const { fetch, calls } = createFetch([
    { body: { id: "admin-user-1", email: "admin@example.com" } },
    {
      body: [{
        id: "trade-1",
        status: "pending",
        admin_exception: true,
      }],
    },
  ]);
  const request = new Request("https://fremontderby.com/api/admin/teams/team-1/trades", {
    method: "POST",
    headers: { authorization: "Bearer admin-token" },
    body: JSON.stringify({
      offeredPlayerId: "player-1",
      requestedTeamId: "team-2",
      requestedPlayerId: "player-2",
    }),
  });

  const response = await handleAdminProposeTeamTradeExceptionRequest(
    request,
    publishEnv,
    "team-1",
    { fetch },
  );

  assert.equal(response.status, 201);
  assert.equal((await response.json()).trade.admin_exception, true);
  assert.equal(calls[1].url, "https://project.supabase.co/rest/v1/rpc/admin_propose_team_trade_exception");
  assert.deepEqual(JSON.parse(calls[1].init.body), {
    actor_user_id: "admin-user-1",
    actor_team_id: "team-1",
    offered_roster_player_id: "player-1",
    requested_roster_team_id: "team-2",
    requested_roster_player_id: "player-2",
  });
});

test("admin trade exception route requires POST", async () => {
  const response = await worker.fetch(
    new Request("https://fremontderby.com/api/admin/teams/team-1/trades"),
    publishEnv,
  );

  assert.equal(response.status, 405);
  assert.deepEqual(await response.json(), { error: "Method not allowed" });
});

test("team trade player response handler authenticates and records acceptance", async () => {
  const { fetch, calls } = createFetch([
    { body: { id: "player-user-1", email: "player@example.com" } },
    {
      body: [{
        id: "trade-1",
        status: "pending",
        requesting_player_accepted_at: "2026-09-01T00:00:00Z",
      }],
    },
  ]);
  const request = new Request(
    "https://fremontderby.com/api/team-trades/trade-1/player-response",
    {
      method: "POST",
      headers: { authorization: "Bearer player-token" },
      body: JSON.stringify({ response: "accepted" }),
    },
  );

  const response = await handleRespondToTeamTradePlayerRequest(
    request,
    publishEnv,
    "trade-1",
    { fetch },
  );

  assert.equal(response.status, 200);
  assert.equal((await response.json()).trade.status, "pending");
  assert.equal(calls[1].url, "https://project.supabase.co/rest/v1/rpc/respond_to_team_trade_player");
  assert.deepEqual(JSON.parse(calls[1].init.body), {
    actor_user_id: "player-user-1",
    target_trade_id: "trade-1",
    response_status: "accepted",
  });
});

test("team trade captain approval handler authenticates and records approval", async () => {
  const { fetch, calls } = createFetch([
    { body: { id: "captain-user-2", email: "captain@example.com" } },
    {
      body: [{
        id: "trade-1",
        status: "completed",
        requested_captain_approved_at: "2026-09-01T00:00:00Z",
        completed_at: "2026-09-01T00:00:01Z",
      }],
    },
  ]);
  const request = new Request(
    "https://fremontderby.com/api/team-trades/trade-1/captain-approval",
    {
      method: "POST",
      headers: { authorization: "Bearer captain-token" },
      body: JSON.stringify({ response: "approved" }),
    },
  );

  const response = await handleApproveTeamTradeCaptainRequest(
    request,
    publishEnv,
    "trade-1",
    { fetch },
  );

  assert.equal(response.status, 200);
  assert.equal((await response.json()).trade.status, "completed");
  assert.equal(calls[1].url, "https://project.supabase.co/rest/v1/rpc/approve_team_trade_captain");
  assert.deepEqual(JSON.parse(calls[1].init.body), {
    actor_user_id: "captain-user-2",
    target_trade_id: "trade-1",
    response_status: "approved",
  });
});

test("team trade action routes require POST", async () => {
  const proposalResponse = await worker.fetch(
    new Request("https://fremontderby.com/api/teams/team-1/trades"),
    publishEnv,
  );
  const playerResponse = await worker.fetch(
    new Request("https://fremontderby.com/api/team-trades/trade-1/player-response"),
    publishEnv,
  );
  const captainResponse = await worker.fetch(
    new Request("https://fremontderby.com/api/team-trades/trade-1/captain-approval"),
    publishEnv,
  );

  // GET /api/teams/:id/trades lists trades and is auth-gated.
  assert.equal(proposalResponse.status, 401);
  assert.equal(playerResponse.status, 405);
  assert.equal(captainResponse.status, 405);
});

test("team invitation response handler authenticates and responds", async () => {
  const { fetch, calls } = createFetch([
    { body: { id: "user-2", email: "player@example.com" } },
    {
      body: [{
        id: "invitation-1",
        season_id: "season-1",
        team_id: "team-1",
        invited_player_id: "player-2",
        status: "accepted",
      }],
    },
  ]);
  const request = new Request(
    "https://fremontderby.com/api/team-invitations/invitation-1/respond",
    {
      method: "POST",
      headers: { authorization: "Bearer player-token" },
      body: JSON.stringify({ response: "accepted" }),
    },
  );

  const response = await handleRespondToTeamInvitationRequest(
    request,
    publishEnv,
    "invitation-1",
    { fetch },
  );

  assert.equal(response.status, 200);
  assert.equal((await response.json()).invitation.status, "accepted");
  assert.equal(calls[1].url, "https://project.supabase.co/rest/v1/rpc/respond_to_team_invitation");
  assert.deepEqual(JSON.parse(calls[1].init.body), {
    actor_user_id: "user-2",
    target_invitation_id: "invitation-1",
    response_status: "accepted",
  });
});

test("team invitation cancellation handler authenticates and cancels", async () => {
  const { fetch, calls } = createFetch([
    { body: { id: "captain-user-1", email: "captain@example.com" } },
    { body: [{ id: "invitation-1", status: "canceled" }] },
  ]);
  const request = new Request(
    "https://fremontderby.com/api/team-invitations/invitation-1/cancel",
    {
      method: "POST",
      headers: { authorization: "Bearer captain-token" },
    },
  );

  const response = await handleCancelTeamInvitationRequest(
    request,
    publishEnv,
    "invitation-1",
    { fetch },
  );

  assert.equal(response.status, 200);
  assert.equal((await response.json()).invitation.status, "canceled");
  assert.equal(calls[1].url, "https://project.supabase.co/rest/v1/rpc/cancel_team_invitation");
  assert.deepEqual(JSON.parse(calls[1].init.body), {
    actor_user_id: "captain-user-1",
    target_invitation_id: "invitation-1",
  });
});

test("team member removal handler authenticates and removes a roster player", async () => {
  const { fetch, calls } = createFetch([
    { body: { id: "captain-user-1", email: "captain@example.com" } },
    {
      body: [{
        id: "membership-1",
        team_id: "team-1",
        player_id: "player-2",
        role: "player",
        ends_at: "2026-09-01T00:00:00Z",
      }],
    },
  ]);
  const request = new Request(
    "https://fremontderby.com/api/team-memberships/membership-1/remove",
    {
      method: "POST",
      headers: { authorization: "Bearer captain-token" },
    },
  );

  const response = await handleRemoveTeamMemberRequest(
    request,
    publishEnv,
    "membership-1",
    { fetch },
  );

  assert.equal(response.status, 200);
  assert.equal((await response.json()).membership.ends_at, "2026-09-01T00:00:00Z");
  assert.equal(calls[1].url, "https://project.supabase.co/rest/v1/rpc/remove_team_member");
  assert.deepEqual(JSON.parse(calls[1].init.body), {
    actor_user_id: "captain-user-1",
    target_membership_id: "membership-1",
  });
});

test("free-agent registration handler authenticates and registers the actor", async () => {
  const { fetch, calls } = createFetch([
    { body: { id: "user-1", email: "player@example.com" } },
    {
      body: [{
        season_id: "season-1",
        player_id: "player-1",
        participation_type: "free_agent",
        status: "active",
      }],
    },
  ]);
  const request = new Request("https://fremontderby.com/api/seasons/season-1/free-agents/me", {
    method: "POST",
    headers: { authorization: "Bearer player-token" },
  });

  const response = await handleRegisterFreeAgentRequest(
    request,
    publishEnv,
    "season-1",
    { fetch },
  );

  assert.equal(response.status, 201);
  assert.equal((await response.json()).freeAgent.participation_type, "free_agent");
  assert.equal(calls[1].url, "https://project.supabase.co/rest/v1/rpc/register_free_agent");
  assert.deepEqual(JSON.parse(calls[1].init.body), {
    actor_user_id: "user-1",
    target_season_id: "season-1",
  });
});

test("free-agent availability handler authenticates and saves round availability", async () => {
  const { fetch, calls } = createFetch([
    { body: { id: "user-1", email: "player@example.com" } },
    {
      body: [{
        season_id: "season-1",
        round_id: "round-1",
        player_id: "player-1",
        status: "available",
      }],
    },
  ]);
  const request = new Request(
    "https://fremontderby.com/api/rounds/round-1/free-agent-availability/me",
    {
      method: "PUT",
      headers: { authorization: "Bearer player-token" },
      body: JSON.stringify({ status: "available" }),
    },
  );

  const response = await handleSetFreeAgentAvailabilityRequest(
    request,
    publishEnv,
    "round-1",
    { fetch },
  );

  assert.equal(response.status, 200);
  assert.equal((await response.json()).availability.status, "available");
  assert.equal(calls[1].url, "https://project.supabase.co/rest/v1/rpc/set_free_agent_availability");
  assert.deepEqual(JSON.parse(calls[1].init.body), {
    actor_user_id: "user-1",
    target_round_id: "round-1",
    availability_status: "available",
  });
});

test("eligible free agents handler authenticates the captain and lists candidates", async () => {
  const { fetch, calls } = createFetch([
    { body: { id: "captain-user-1", email: "captain@example.com" } },
    {
      body: [{
        season_id: "season-1",
        round_id: "round-1",
        player_id: "player-2",
        display_name: "Morgan",
        fargo_rating: 525,
        rating_status: "established",
        availability_status: "available",
      }],
    },
  ]);
  const request = new Request(
    "https://fremontderby.com/api/teams/team-1/rounds/round-1/eligible-free-agents",
    {
      headers: { authorization: "Bearer captain-token" },
    },
  );

  const response = await handleListEligibleFreeAgentsRequest(
    request,
    publishEnv,
    { teamId: "team-1", roundId: "round-1" },
    { fetch },
  );

  assert.equal(response.status, 200);
  assert.equal((await response.json()).freeAgents[0].display_name, "Morgan");
  assert.equal(calls[0].url, "https://project.supabase.co/auth/v1/user");
  assert.equal(calls[1].url, "https://project.supabase.co/rest/v1/rpc/list_eligible_free_agents");
  assert.deepEqual(JSON.parse(calls[1].init.body), {
    actor_user_id: "captain-user-1",
    target_team_id: "team-1",
    target_round_id: "round-1",
  });
});

test("eligible free agents handler treats non-captain access as forbidden", async () => {
  const { fetch } = createFetch([
    { body: { id: "player-user-1", email: "player@example.com" } },
    { status: 400, body: { message: "Only the active captain can view eligible free agents" } },
  ]);
  const request = new Request(
    "https://fremontderby.com/api/teams/team-1/rounds/round-1/eligible-free-agents",
    {
      headers: { authorization: "Bearer player-token" },
    },
  );

  const response = await handleListEligibleFreeAgentsRequest(
    request,
    publishEnv,
    { teamId: "team-1", roundId: "round-1" },
    { fetch },
  );

  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), {
    error: "Only the active captain can view eligible free agents",
  });
});

test("eligible free agents route allows only GET", async () => {
  const response = await worker.fetch(
    new Request(
      "https://fremontderby.com/api/teams/team-1/rounds/round-1/eligible-free-agents",
      { method: "POST" },
    ),
    publishEnv,
  );

  assert.equal(response.status, 405);
  assert.deepEqual(await response.json(), { error: "Method not allowed" });
});

test("roster availability handler authenticates and saves round availability", async () => {
  const { fetch, calls } = createFetch([
    { body: { id: "user-1", email: "player@example.com" } },
    {
      body: [{
        season_id: "season-1",
        round_id: "round-1",
        team_id: "team-1",
        player_id: "player-1",
        status: "available",
      }],
    },
  ]);
  const request = new Request(
    "https://fremontderby.com/api/rounds/round-1/availability/me",
    {
      method: "PUT",
      headers: { authorization: "Bearer player-token" },
      body: JSON.stringify({ status: "available" }),
    },
  );

  const response = await handleSetRosterAvailabilityRequest(
    request,
    publishEnv,
    "round-1",
    { fetch },
  );

  assert.equal(response.status, 200);
  assert.equal((await response.json()).availability.status, "available");
  assert.equal(calls[0].url, "https://project.supabase.co/auth/v1/user");
  assert.equal(calls[1].url, "https://project.supabase.co/rest/v1/rpc/set_roster_availability");
  assert.deepEqual(JSON.parse(calls[1].init.body), {
    actor_user_id: "user-1",
    target_round_id: "round-1",
    availability_status: "available",
  });
});

test("roster availability route allows only PUT", async () => {
  const response = await worker.fetch(
    new Request("https://fremontderby.com/api/rounds/round-1/availability/me"),
    publishEnv,
  );

  assert.equal(response.status, 405);
  assert.deepEqual(await response.json(), { error: "Method not allowed" });
});

test("roster availability handler treats non-roster access as forbidden", async () => {
  const { fetch } = createFetch([
    { body: { id: "user-1", email: "player@example.com" } },
    {
      status: 400,
      body: { message: "Active roster membership is required before setting availability" },
    },
  ]);
  const request = new Request(
    "https://fremontderby.com/api/rounds/round-1/availability/me",
    {
      method: "PUT",
      headers: { authorization: "Bearer player-token" },
      body: JSON.stringify({ status: "available" }),
    },
  );

  const response = await handleSetRosterAvailabilityRequest(
    request,
    publishEnv,
    "round-1",
    { fetch },
  );

  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), {
    error: "Active roster membership is required before setting availability",
  });
});

test("team round availability handler returns roster rows plus eligible free agents", async () => {
  const { fetch, calls } = createFetch([
    { body: { id: "captain-user-1", email: "captain@example.com" } },
    {
      body: [
        {
          season_id: "season-1",
          round_id: "round-1",
          team_id: "team-1",
          player_id: "player-1",
          display_name: "Kai",
          role: "captain",
          participation_type: "roster",
          fargo_rating: 530,
          rating_status: "established",
          availability_status: "available",
        },
        {
          season_id: "season-1",
          round_id: "round-1",
          team_id: "team-1",
          player_id: "player-2",
          display_name: "Morgan",
          role: null,
          participation_type: "free_agent",
          fargo_rating: 525,
          rating_status: "established",
          availability_status: "available",
        },
      ],
    },
  ]);
  const request = new Request(
    "https://fremontderby.com/api/teams/team-1/rounds/round-1/availability",
    {
      headers: { authorization: "Bearer captain-token" },
    },
  );

  const response = await handleListTeamRoundAvailabilityRequest(
    request,
    publishEnv,
    { teamId: "team-1", roundId: "round-1" },
    { fetch },
  );

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(
    body.availability.map((row) => row.participation_type),
    ["roster", "free_agent"],
  );
  assert.equal(calls[1].url, "https://project.supabase.co/rest/v1/rpc/list_team_round_availability");
  assert.deepEqual(JSON.parse(calls[1].init.body), {
    actor_user_id: "captain-user-1",
    target_team_id: "team-1",
    target_round_id: "round-1",
  });
});

test("team round availability route allows only GET", async () => {
  const writeResponse = await worker.fetch(
    new Request(
      "https://fremontderby.com/api/teams/team-1/rounds/round-1/availability",
      { method: "POST" },
    ),
    publishEnv,
  );
  const deleteResponse = await worker.fetch(
    new Request(
      "https://fremontderby.com/api/teams/team-1/rounds/round-1/availability",
      { method: "DELETE" },
    ),
    publishEnv,
  );

  // POST/PUT set own availability and are auth-gated. DELETE stays rejected.
  assert.equal(writeResponse.status, 401);
  assert.equal(deleteResponse.status, 405);
  assert.deepEqual(await deleteResponse.json(), { error: "Method not allowed" });
});

test("team lineup handler authenticates the captain and submits slots", async () => {
  const { fetch, calls } = createFetch([
    { body: { id: "captain-user-1", email: "captain@example.com" } },
    {
      body: [
        {
          lineup_id: "lineup-1",
          season_id: "season-1",
          round_id: "round-1",
          team_match_id: "team-match-1",
          team_id: "team-1",
          slot_number: 1,
          player_id: "player-1",
          participation_type: "roster",
        },
        {
          lineup_id: "lineup-1",
          season_id: "season-1",
          round_id: "round-1",
          team_match_id: "team-match-1",
          team_id: "team-1",
          slot_number: 2,
          player_id: "player-2",
          participation_type: "free_agent",
        },
      ],
    },
  ]);
  const request = new Request(
    "https://fremontderby.com/api/teams/team-1/rounds/round-1/lineup",
    {
      method: "POST",
      headers: { authorization: "Bearer captain-token" },
      body: JSON.stringify({
        slots: [
          { slotNumber: 1, playerId: "player-1" },
          { slotNumber: 2, playerId: "player-2" },
        ],
      }),
    },
  );

  const response = await handleSubmitTeamLineupRequest(
    request,
    publishEnv,
    { teamId: "team-1", roundId: "round-1" },
    { fetch },
  );

  assert.equal(response.status, 200);
  assert.deepEqual(
    (await response.json()).lineup.map((slot) => slot.participation_type),
    ["roster", "free_agent"],
  );
  assert.equal(calls[0].url, "https://project.supabase.co/auth/v1/user");
  assert.equal(calls[1].url, "https://project.supabase.co/rest/v1/rpc/submit_team_lineup");
  assert.deepEqual(JSON.parse(calls[1].init.body), {
    actor_user_id: "captain-user-1",
    target_team_id: "team-1",
    target_round_id: "round-1",
    lineup_slots: [
      { slotNumber: 1, playerId: "player-1" },
      { slotNumber: 2, playerId: "player-2" },
    ],
  });
});

test("team lineup handler treats duplicate round scheduling as a conflict", async () => {
  const { fetch } = createFetch([
    { body: { id: "captain-user-1", email: "captain@example.com" } },
    {
      status: 400,
      body: { message: "Player is already scheduled for another team in this round" },
    },
  ]);
  const request = new Request(
    "https://fremontderby.com/api/teams/team-1/rounds/round-1/lineup",
    {
      method: "POST",
      headers: { authorization: "Bearer captain-token" },
      body: JSON.stringify({ slots: [{ slotNumber: 1, playerId: "player-1" }] }),
    },
  );

  const response = await handleSubmitTeamLineupRequest(
    request,
    publishEnv,
    { teamId: "team-1", roundId: "round-1" },
    { fetch },
  );

  assert.equal(response.status, 409);
  assert.deepEqual(await response.json(), {
    error: "Player is already scheduled for another team in this round",
  });
});

test("visible team lineups handler returns only revealable lineup slots", async () => {
  const { fetch, calls } = createFetch([
    { body: { id: "captain-user-1", email: "captain@example.com" } },
    {
      body: [
        {
          lineup_id: "lineup-1",
          season_id: "season-1",
          round_id: "round-1",
          team_match_id: "team-match-1",
          team_id: "team-1",
          is_own_team: true,
          opponent_lineup_visible: false,
          slot_number: 1,
          player_id: "player-1",
          participation_type: "roster",
        },
      ],
    },
  ]);
  const request = new Request(
    "https://fremontderby.com/api/teams/team-1/rounds/round-1/lineup",
    {
      headers: { authorization: "Bearer captain-token" },
    },
  );

  const response = await handleListVisibleTeamLineupsRequest(
    request,
    publishEnv,
    { teamId: "team-1", roundId: "round-1" },
    { fetch },
  );

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.lineups[0].is_own_team, true);
  assert.equal(body.lineups[0].opponent_lineup_visible, false);
  assert.equal(calls[1].url, "https://project.supabase.co/rest/v1/rpc/list_visible_team_lineups");
  assert.deepEqual(JSON.parse(calls[1].init.body), {
    actor_user_id: "captain-user-1",
    target_team_id: "team-1",
    target_round_id: "round-1",
  });
});

test("team lineup route allows only GET and POST", async () => {
  const response = await worker.fetch(
    new Request(
      "https://fremontderby.com/api/teams/team-1/rounds/round-1/lineup",
      { method: "PUT" },
    ),
    publishEnv,
  );

  assert.equal(response.status, 405);
  assert.deepEqual(await response.json(), { error: "Method not allowed" });
});

test("public season list handler returns registration progress", async () => {
  const { fetch, calls } = createFetch([{
    body: [{
        id: "season-1",
        name: "Fremont Derby Season 1",
        status: "registration",
        first_round_date: "2026-09-03",
        team_count: 1,
        confirmed_team_count: 0,
        team_capacity: 8,
        minimum_committed_roster: 3,
        occupied_slots: 1,
        open_team_slots: 7,
        reserved_returning_slots: 0,
        held_team_slots: 1,
        applications_waiting: 2,
        rostered_player_count: 2,
        registered_player_count: 4,
        free_agent_count: 2,
        open_primary_roster_spots: 3,
        at_risk_team_count: 0,
      }],
  }]);

  const response = await handleListPublicSeasonsRequest(new Request("https://example.test/api/seasons"), publishEnv, { fetch });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.seasons[0].name, "Fremont Derby Season 1");
  assert.equal(body.seasons[0].teamCount, 1);
  assert.equal(body.seasons[0].openTeamSlots, 7);
  assert.equal(body.seasons[0].rosteredPlayerCount, 2);
  assert.equal(body.seasons[0].applicationsWaiting, 2);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://project.supabase.co/rest/v1/rpc/list_public_season_registration");
});

test("public season list route allows only GET", async () => {
  const response = await worker.fetch(
    new Request("https://fremontderby.com/api/seasons", { method: "POST" }),
    publishEnv,
  );

  assert.equal(response.status, 405);
  assert.deepEqual(await response.json(), { error: "Method not allowed" });
});

test("team standings handler returns public season standings", async () => {
  const { fetch, calls } = createFetch([
    { body: [{ id: "season-1" }] },
    {
      body: [{
        season_id: "season-1",
        team_id: "team-1",
        team_name: "Breakers",
        standings_rank: 1,
        games_played: 1,
        maximum_matches: 7,
        standing_points: 2,
        team_wins: 1,
        match_points: 3,
      }],
    },
    { body: [{ id: "match-1", status: "finalized" }] },
    { body: [{ id: "round-1", status: "finalized" }] },
  ]);

  const response = await handleListTeamStandingsRequest(
    new Request("https://example.test/api/seasons/season-1/team-standings"),
    publishEnv,
    "season-1",
    { fetch },
  );

  assert.equal(response.status, 200);
  assert.ok(response.headers.get("etag")?.startsWith("W/"));
  assert.equal((await response.json()).standings[0].team_name, "Breakers");
  assert.match(calls[0].url, /seasons\?/);
  assert.equal(calls[1].url, "https://project.supabase.co/rest/v1/rpc/list_team_standings");
  assert.match(calls[2].url, /team_matches/);
  assert.match(calls[3].url, /rounds/);
  assert.deepEqual(JSON.parse(calls[1].init.body), {
    target_season_id: "season-1",
  });
});

test("team standings route allows only GET", async () => {
  const response = await worker.fetch(
    new Request(
      "https://fremontderby.com/api/seasons/season-1/team-standings",
      { method: "POST" },
    ),
    publishEnv,
  );

  assert.equal(response.status, 405);
  assert.deepEqual(await response.json(), { error: "Method not allowed" });
});

test("individual standings handler returns public season standings", async () => {
  const { fetch, calls } = createFetch([
    { body: [{ id: "season-1" }] },
    {
      body: [{
        season_id: "season-1",
        player_id: "player-1",
        display_name: "Kai",
        standings_rank: 1,
        prize_rank: 1,
        matches_played: 5,
        minimum_matches: 5,
        is_prize_eligible: true,
        wins: 4,
        losses: 1,
        win_percentage: "0.8000",
      }],
    },
    { body: [{ id: "match-1", status: "finalized" }] },
    { body: [{ id: "round-1", status: "finalized" }] },
  ]);

  const response = await handleListIndividualStandingsRequest(
    new Request("https://example.test/api/seasons/season-1/individual-standings"),
    publishEnv,
    "season-1",
    { fetch },
  );

  assert.equal(response.status, 200);
  assert.ok(response.headers.get("etag")?.startsWith("W/"));
  assert.equal((await response.json()).standings[0].display_name, "Kai");
  assert.match(calls[0].url, /seasons\?/);
  assert.equal(calls[1].url, "https://project.supabase.co/rest/v1/rpc/list_individual_standings");
  assert.match(calls[2].url, /team_matches/);
  assert.match(calls[3].url, /rounds/);
  assert.deepEqual(JSON.parse(calls[1].init.body), {
    target_season_id: "season-1",
  });
});

test("individual standings route allows only GET", async () => {
  const response = await worker.fetch(
    new Request(
      "https://fremontderby.com/api/seasons/season-1/individual-standings",
      { method: "POST" },
    ),
    publishEnv,
  );

  assert.equal(response.status, 405);
  assert.deepEqual(await response.json(), { error: "Method not allowed" });
});

test("season prize summary handler returns public aggregate purse information", async () => {
  const { fetch, calls } = createFetch([
    {
      body: [{
        season_id: "season-1",
        season_name: "Fall 2026",
        player_count: 32,
        paid_amount_cents: 120000,
        committed_amount_cents: 160000,
        entry_fee_cents: 5000,
        administration_amount_cents: 10000,
        projected_prize_pool_cents: 150000,
        team_prize_pool_cents: 90000,
        individual_prize_pool_cents: 60000,
        projected_payouts: [{ pool: "team", place: 1, amountCents: 63000 }],
        finalized_payouts: [],
      }],
    },
  ]);

  const response = await handleGetSeasonPrizeSummaryRequest(
    new Request("https://example.test/api/seasons/season-1/prizes"),
    publishEnv,
    "season-1",
    { fetch },
  );

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.summary.player_count, 32);
  assert.equal(body.summary.paid_amount_cents, 120000);
  assert.equal(calls[0].url, "https://project.supabase.co/rest/v1/rpc/get_season_prize_summary");
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    target_season_id: "season-1",
  });
});

test("season prize summary route allows only GET", async () => {
  const response = await worker.fetch(
    new Request(
      "https://fremontderby.com/api/seasons/season-1/prizes",
      { method: "POST" },
    ),
    publishEnv,
  );

  assert.equal(response.status, 405);
  assert.deepEqual(await response.json(), { error: "Method not allowed" });
});

test("configure season prizes handler authenticates an admin configuration", async () => {
  const { fetch, calls } = createFetch([
    { body: { id: "admin-user-1", email: "admin@example.com" } },
    {
      body: [{
        configuration_id: "configuration-1",
        season_id: "season-1",
        version: 1,
        projected_prize_pool_cents: 150000,
      }],
    },
  ]);
  const request = new Request("https://fremontderby.com/api/admin/seasons/season-1/prizes", {
    method: "POST",
    headers: { authorization: "Bearer admin-token" },
    body: JSON.stringify({
      entryFeeCents: 5000,
      administrationAmountCents: 10000,
      teamAllocationBasisPoints: 6000,
      individualAllocationBasisPoints: 4000,
      projectedFieldSize: 32,
      payoutTemplates: [
        { pool: "team", place: 1, label: "Team champion", allocationBasisPoints: 7000 },
        { pool: "team", place: 2, label: "Team runner-up", allocationBasisPoints: 3000 },
        { pool: "individual", place: 1, label: "Individual champion", allocationBasisPoints: 10000 },
      ],
    }),
  });

  const response = await handleConfigureSeasonPrizesRequest(
    request,
    publishEnv,
    "season-1",
    { fetch },
  );

  assert.equal(response.status, 201);
  assert.equal((await response.json()).configuration.version, 1);
  assert.equal(calls[0].url, "https://project.supabase.co/auth/v1/user");
  assert.equal(calls[1].url, "https://project.supabase.co/rest/v1/rpc/configure_season_prizes");
  assert.deepEqual(JSON.parse(calls[1].init.body), {
    actor_user_id: "admin-user-1",
    target_season_id: "season-1",
    configured_entry_fee_cents: 5000,
    configured_administration_amount_cents: 10000,
    configured_team_allocation_basis_points: 6000,
    configured_individual_allocation_basis_points: 4000,
    configured_projected_field_size: 32,
    payout_templates: [
      { pool: "team", place: 1, label: "Team champion", allocationBasisPoints: 7000 },
      { pool: "team", place: 2, label: "Team runner-up", allocationBasisPoints: 3000 },
      { pool: "individual", place: 1, label: "Individual champion", allocationBasisPoints: 10000 },
    ],
  });
});

test("configure season prizes route requires POST", async () => {
  const response = await worker.fetch(
    new Request("https://fremontderby.com/api/admin/seasons/season-1/prizes"),
    publishEnv,
  );

  assert.equal(response.status, 405);
  assert.deepEqual(await response.json(), { error: "Method not allowed" });
});

test("finalize season prize payouts handler writes immutable payout rows", async () => {
  const { fetch, calls } = createFetch([
    { body: { id: "admin-user-1", email: "admin@example.com" } },
    {
      body: [{
        season_id: "season-1",
        pool: "team",
        place: 1,
        label: "Team champion",
        amount_cents: 100000,
      }],
    },
  ]);
  const request = new Request("https://fremontderby.com/api/admin/seasons/season-1/prizes/finalize", {
    method: "POST",
    headers: { authorization: "Bearer admin-token" },
    body: JSON.stringify({
      finalizedPayouts: [
        { pool: "team", place: 1, label: "Team champion", amountCents: 100000 },
      ],
    }),
  });

  const response = await handleFinalizeSeasonPrizePayoutsRequest(
    request,
    publishEnv,
    "season-1",
    { fetch },
  );

  assert.equal(response.status, 201);
  assert.equal((await response.json()).payouts[0].amount_cents, 100000);
  assert.equal(calls[1].url, "https://project.supabase.co/rest/v1/rpc/finalize_season_prize_payouts");
  assert.deepEqual(JSON.parse(calls[1].init.body), {
    actor_user_id: "admin-user-1",
    target_season_id: "season-1",
    finalized_payouts: [
      { pool: "team", place: 1, label: "Team champion", amountCents: 100000 },
    ],
  });
});

test("finalize season prize payouts handler treats previous finalization as a conflict", async () => {
  const { fetch } = createFetch([
    { body: { id: "admin-user-1", email: "admin@example.com" } },
    { status: 400, body: { message: "Season prize payouts are already finalized" } },
  ]);
  const request = new Request("https://fremontderby.com/api/admin/seasons/season-1/prizes/finalize", {
    method: "POST",
    headers: { authorization: "Bearer admin-token" },
    body: JSON.stringify({
      finalizedPayouts: [
        { pool: "team", place: 1, amountCents: 100000 },
        { pool: "individual", place: 1, amountCents: 50000 },
      ],
    }),
  });

  const response = await handleFinalizeSeasonPrizePayoutsRequest(
    request,
    publishEnv,
    "season-1",
    { fetch },
  );

  assert.equal(response.status, 409);
  assert.deepEqual(await response.json(), {
    error: "Season prize payouts are already finalized",
  });
});

test("player match scorecard handler authenticates and loads current scorecard state", async () => {
  const { fetch, calls } = createFetch([
    { body: { id: "player-user-1", email: "player@example.com" } },
    {
      body: [{
        player_match_id: "player-match-1",
        player_a_display_name: "Kai",
        player_b_display_name: "Morgan",
        player_a_fargo_rating: 530,
        player_b_fargo_rating: 510,
        race_to_a: 5,
        race_to_b: 4,
        current_discipline: "8-ball",
        score_a: 1,
        score_b: 0,
        racks: [{ rackNumber: 1, winnerSide: "A" }],
      }],
    },
  ]);
  const request = new Request(
    "https://fremontderby.com/api/player-matches/player-match-1/scorecard",
    {
      headers: { authorization: "Bearer player-token" },
    },
  );

  const response = await handleGetPlayerMatchScorecardRequest(
    request,
    publishEnv,
    "player-match-1",
    { fetch },
  );

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.scorecard.current_discipline, "8-ball");
  assert.equal(body.scorecard.racks[0].winnerSide, "A");
  assert.equal(calls[0].url, "https://project.supabase.co/auth/v1/user");
  assert.equal(calls[1].url, "https://project.supabase.co/rest/v1/rpc/get_player_match_scorecard");
  assert.deepEqual(JSON.parse(calls[1].init.body), {
    actor_user_id: "player-user-1",
    target_player_match_id: "player-match-1",
  });
});

test("record rack handler authenticates and records one winner-side action", async () => {
  const { fetch, calls } = createFetch([
    { body: { id: "player-user-1", email: "player@example.com" } },
    {
      body: [{
        player_match_id: "player-match-1",
        rack_number: 2,
        discipline: "8-ball",
        winner_side: "B",
        score_a: 1,
        score_b: 1,
        current_discipline: "8-ball",
        match_winner_side: null,
      }],
    },
  ]);
  const request = new Request(
    "https://fremontderby.com/api/player-matches/player-match-1/racks",
    {
      method: "POST",
      headers: { authorization: "Bearer player-token" },
      body: JSON.stringify({ winnerSide: "B" }),
    },
  );

  const response = await handleRecordPlayerMatchRackRequest(
    request,
    publishEnv,
    "player-match-1",
    { fetch },
  );

  assert.equal(response.status, 201);
  assert.equal((await response.json()).rack.winner_side, "B");
  assert.equal(calls[1].url, "https://project.supabase.co/rest/v1/rpc/record_player_match_rack");
  assert.deepEqual(JSON.parse(calls[1].init.body), {
    actor_user_id: "player-user-1",
    target_player_match_id: "player-match-1",
    rack_winner_side: "B",
  });
});

test("record rack handler treats complete matches as conflicts", async () => {
  const { fetch } = createFetch([
    { body: { id: "player-user-1", email: "player@example.com" } },
    { status: 400, body: { message: "Player match is already complete" } },
  ]);
  const request = new Request(
    "https://fremontderby.com/api/player-matches/player-match-1/racks",
    {
      method: "POST",
      headers: { authorization: "Bearer player-token" },
      body: JSON.stringify({ winnerSide: "A" }),
    },
  );

  const response = await handleRecordPlayerMatchRackRequest(
    request,
    publishEnv,
    "player-match-1",
    { fetch },
  );

  assert.equal(response.status, 409);
  assert.deepEqual(await response.json(), {
    error: "Player match is already complete",
  });
});

test("undo rack handler authenticates and removes the latest unfinalized rack", async () => {
  const { fetch, calls } = createFetch([
    { body: { id: "player-user-1", email: "player@example.com" } },
    {
      body: [{
        player_match_id: "player-match-1",
        undone_rack_number: 2,
        undone_winner_side: "B",
        score_a: 1,
        score_b: 0,
        current_discipline: "8-ball",
        winner_side: null,
        winner_player_id: null,
        status: "in_progress",
      }],
    },
  ]);
  const request = new Request(
    "https://fremontderby.com/api/player-matches/player-match-1/racks/undo",
    {
      method: "POST",
      headers: { authorization: "Bearer player-token" },
    },
  );

  const response = await handleUndoPlayerMatchRackRequest(
    request,
    publishEnv,
    "player-match-1",
    { fetch },
  );

  assert.equal(response.status, 200);
  assert.equal((await response.json()).undo.undone_rack_number, 2);
  assert.equal(calls[1].url, "https://project.supabase.co/rest/v1/rpc/undo_player_match_rack");
  assert.deepEqual(JSON.parse(calls[1].init.body), {
    actor_user_id: "player-user-1",
    target_player_match_id: "player-match-1",
  });
});

test("undo rack handler treats missing rack history as a conflict", async () => {
  const { fetch } = createFetch([
    { body: { id: "player-user-1", email: "player@example.com" } },
    { status: 400, body: { message: "Player match has no racks to undo" } },
  ]);
  const request = new Request(
    "https://fremontderby.com/api/player-matches/player-match-1/racks/undo",
    {
      method: "POST",
      headers: { authorization: "Bearer player-token" },
    },
  );

  const response = await handleUndoPlayerMatchRackRequest(
    request,
    publishEnv,
    "player-match-1",
    { fetch },
  );

  assert.equal(response.status, 409);
  assert.deepEqual(await response.json(), {
    error: "Player match has no racks to undo",
  });
});

test("player match scorecard route allows only GET", async () => {
  const response = await worker.fetch(
    new Request(
      "https://fremontderby.com/api/player-matches/player-match-1/scorecard",
      { method: "POST" },
    ),
    publishEnv,
  );

  assert.equal(response.status, 405);
  assert.deepEqual(await response.json(), { error: "Method not allowed" });
});

test("player match racks route allows only POST", async () => {
  const response = await worker.fetch(
    new Request("https://fremontderby.com/api/player-matches/player-match-1/racks"),
    publishEnv,
  );

  assert.equal(response.status, 405);
  assert.deepEqual(await response.json(), { error: "Method not allowed" });
});

test("player match rack undo route allows only POST", async () => {
  const response = await worker.fetch(
    new Request("https://fremontderby.com/api/player-matches/player-match-1/racks/undo"),
    publishEnv,
  );

  assert.equal(response.status, 405);
  assert.deepEqual(await response.json(), { error: "Method not allowed" });
});

test("finalize player match handler authenticates and finalizes completed races", async () => {
  const { fetch, calls } = createFetch([
    { body: { id: "player-user-1", email: "player@example.com" } },
    {
      body: [{
        player_match_id: "player-match-1",
        status: "finalized",
        winner_side: "A",
        winner_player_id: "player-1",
        score_a: 5,
        score_b: 3,
      }],
    },
  ]);
  const request = new Request(
    "https://fremontderby.com/api/player-matches/player-match-1/finalize",
    {
      method: "POST",
      headers: { authorization: "Bearer player-token" },
    },
  );

  const response = await handleFinalizePlayerMatchRequest(
    request,
    publishEnv,
    "player-match-1",
    { fetch },
  );

  assert.equal(response.status, 200);
  assert.equal((await response.json()).match.status, "finalized");
  assert.equal(calls[1].url, "https://project.supabase.co/rest/v1/rpc/finalize_player_match");
  assert.deepEqual(JSON.parse(calls[1].init.body), {
    actor_user_id: "player-user-1",
    target_player_match_id: "player-match-1",
  });
});

test("finalize player match handler rejects incomplete races as conflicts", async () => {
  const { fetch } = createFetch([
    { body: { id: "player-user-1", email: "player@example.com" } },
    { status: 400, body: { message: "Race target must be reached before finalization" } },
  ]);
  const request = new Request(
    "https://fremontderby.com/api/player-matches/player-match-1/finalize",
    {
      method: "POST",
      headers: { authorization: "Bearer player-token" },
    },
  );

  const response = await handleFinalizePlayerMatchRequest(
    request,
    publishEnv,
    "player-match-1",
    { fetch },
  );

  assert.equal(response.status, 409);
  assert.deepEqual(await response.json(), {
    error: "Race target must be reached before finalization",
  });
});

test("finalize player match route allows only POST", async () => {
  const response = await worker.fetch(
    new Request("https://fremontderby.com/api/player-matches/player-match-1/finalize"),
    publishEnv,
  );

  assert.equal(response.status, 405);
  assert.deepEqual(await response.json(), { error: "Method not allowed" });
});

test("correct player match handler authenticates an admin correction", async () => {
  const { fetch, calls } = createFetch([
    { body: { id: "admin-user-1", email: "admin@example.com" } },
    {
      body: [{
        player_match_id: "player-match-1",
        status: "corrected",
        winner_side: "B",
        score_a: 3,
        score_b: 5,
        correction_reason: "Wrong winner was entered",
      }],
    },
  ]);
  const request = new Request(
    "https://fremontderby.com/api/player-matches/player-match-1/correct",
    {
      method: "POST",
      headers: { authorization: "Bearer admin-token" },
      body: JSON.stringify({
        winnerSide: "B",
        scoreA: 3,
        scoreB: 5,
        reason: "Wrong winner was entered",
        racks: [
          { winnerSide: "A" },
          { winnerSide: "B" },
          { winnerSide: "B" },
          { winnerSide: "A" },
          { winnerSide: "B" },
          { winnerSide: "B" },
          { winnerSide: "B" },
          { winnerSide: "A" },
        ],
      }),
    },
  );

  const response = await handleCorrectPlayerMatchRequest(
    request,
    publishEnv,
    "player-match-1",
    { fetch },
  );

  assert.equal(response.status, 200);
  assert.equal((await response.json()).match.status, "corrected");
  assert.equal(calls[0].url, "https://project.supabase.co/auth/v1/user");
  assert.equal(calls[1].url, "https://project.supabase.co/rest/v1/rpc/correct_player_match");
  assert.deepEqual(JSON.parse(calls[1].init.body), {
    actor_user_id: "admin-user-1",
    target_player_match_id: "player-match-1",
    corrected_winner_side: "B",
    corrected_score_a: 3,
    corrected_score_b: 5,
    correction_reason_text: "Wrong winner was entered",
    corrected_racks: [
      { winnerSide: "A" },
      { winnerSide: "B" },
      { winnerSide: "B" },
      { winnerSide: "A" },
      { winnerSide: "B" },
      { winnerSide: "B" },
      { winnerSide: "B" },
      { winnerSide: "A" },
    ],
  });
});

test("correct player match handler treats non-admin corrections as forbidden", async () => {
  const { fetch } = createFetch([
    { body: { id: "player-user-1", email: "player@example.com" } },
    { status: 400, body: { message: "Actor is not a league admin" } },
  ]);
  const request = new Request(
    "https://fremontderby.com/api/player-matches/player-match-1/correct",
    {
      method: "POST",
      headers: { authorization: "Bearer player-token" },
      body: JSON.stringify({
        winnerSide: "B",
        scoreA: 3,
        scoreB: 5,
        reason: "Wrong winner was entered",
        racks: [{ winnerSide: "B" }],
      }),
    },
  );

  const response = await handleCorrectPlayerMatchRequest(
    request,
    publishEnv,
    "player-match-1",
    { fetch },
  );

  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), {
    error: "Actor is not a league admin",
  });
});

test("correct player match handler treats invalid corrected race state as a conflict", async () => {
  const { fetch } = createFetch([
    { body: { id: "admin-user-1", email: "admin@example.com" } },
    { status: 400, body: { message: "Player match is not in a valid corrected race state" } },
  ]);
  const request = new Request(
    "https://fremontderby.com/api/player-matches/player-match-1/correct",
    {
      method: "POST",
      headers: { authorization: "Bearer admin-token" },
      body: JSON.stringify({
        winnerSide: "B",
        scoreA: 5,
        scoreB: 5,
        reason: "Wrong score was entered",
        racks: [{ winnerSide: "B" }],
      }),
    },
  );

  const response = await handleCorrectPlayerMatchRequest(
    request,
    publishEnv,
    "player-match-1",
    { fetch },
  );

  assert.equal(response.status, 409);
  assert.deepEqual(await response.json(), {
    error: "Player match is not in a valid corrected race state",
  });
});

test("correct player match route allows only POST", async () => {
  const response = await worker.fetch(
    new Request("https://fremontderby.com/api/player-matches/player-match-1/correct"),
    publishEnv,
  );

  assert.equal(response.status, 405);
  assert.deepEqual(await response.json(), { error: "Method not allowed" });
});

test("admin season list handler returns discoverable season names and statuses", async () => {
  const { fetch, calls } = createFetch([
    { body: { id: "admin-user-1", email: "admin@example.com" } },
    {
      body: [
        { id: "season-live", name: "Fremont Derby Season 1", status: "registration" },
        { id: "season-war", name: "Season 1 War Game", status: "playoffs" },
      ],
    },
    { body: [{ id: "season-live" }] },
  ]);
  const request = new Request("https://fremontderby.com/api/admin/seasons", {
    headers: { authorization: "Bearer admin-token" },
  });

  const response = await handleListAdminSeasonsRequest(request, publishEnv, { fetch });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(
    body.seasons.map((season) => [season.name, season.status]),
    [
      ["Fremont Derby Season 1", "registration"],
      ["Season 1 War Game", "playoffs"],
    ],
  );
  assert.equal(calls[0].url, "https://project.supabase.co/auth/v1/user");
  assert.equal(calls[1].url, "https://project.supabase.co/rest/v1/seasons?select=id,name,status,created_at&order=created_at.desc");
  assert.equal(calls[2].url, "https://project.supabase.co/rest/v1/rpc/get_season_setup");
});
