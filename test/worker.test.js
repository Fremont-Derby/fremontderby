import test from "node:test";
import assert from "node:assert/strict";
import worker, {
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
  handleRegisterFreeAgentRequest,
  handleRemoveTeamMemberRequest,
  handleRespondToTeamInvitationRequest,
  handleSaveOwnProfileRequest,
  handleSetFreeAgentAvailabilityRequest,
  handleSetRosterAvailabilityRequest,
  handleSubmitTeamLineupRequest,
  handleRecordPlayerMatchRackRequest,
  handleUndoPlayerMatchRackRequest,
  renderLandingPage
} from "../src/index.js";


const env = {
  CF_VERSION_METADATA: {
    id: "test-version-123",
    tag: "test",
    timestamp: "2026-08-09T23:40:00Z"
  }
};

const publishEnv = {
  ...env,
  SUPABASE_URL: "https://project.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "publishable-key",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key"
};

const productionReadyEnv = {
  ...env,
  ENVIRONMENT: "production",
  SUPABASE_URL: "https://cpiucsxlkicmlbvdvhww.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "publishable-key",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key"
};

const seasonTeams = Array.from({ length: 8 }, (_, index) => ({
  id: `00000000-0000-0000-0000-${String(index + 1).padStart(12, "0")}`
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
        headers: { "content-type": "application/json" }
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
    deployedAt: "2026-08-09T23:40:00Z"
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
  assert.doesNotMatch(JSON.stringify(body), /cpiucsxlkicmlbvdvhww/);
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
  const response = await worker.fetch(
    new Request("https://fremontderby.com/availability?season=season-1&round=round-1"),
    publishEnv,
  );

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /text\/html/);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const html = await response.text();
  assert.match(html, /Fremont Derby Availability/);
  assert.match(html, /data-register/);
  assert.match(html, /data-roster-status/);
  assert.match(html, /data-free-agent-status/);
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
        tableNumbers: [1, 2, 3, 4]
      })
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

