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
