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
  assert.deepEqual(managementBody.teamManagement.captain_teams, [{ teamName: "Breakers", members: [], roster: [] }]);
  assert.deepEqual(managementBody.teamManagement.invitations, [{ teamName: "Rack Pack" }]);
  assert.ok(Array.isArray(managementBody.teamManagement.applications));
  assert.ok(Array.isArray(managementBody.teamManagement.returning_slots));
  assert.equal(calls[0].url, "https://project.supabase.co/auth/v1/user");
  assert.equal(calls[1].url, "https://project.supabase.co/rest/v1/rpc/get_own_team_management");
  assert.deepEqual(JSON.parse(calls[1].init.body), {
    actor_user_id: "user-1",
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

  // Team-scoped GET lists trades and authenticates first; action aliases still reject non-POST.
  assert.equal(proposalResponse.status, 401);
  assert.equal(playerResponse.status, 405);
  assert.equal(captainResponse.status, 405);
});
test("team round availability route allows only GET", async () => {
  const response = await worker.fetch(
    new Request(
      "https://fremontderby.com/api/teams/team-1/rounds/round-1/availability",
      { method: "POST" },
    ),
    publishEnv,
  );

  // POST is an authenticated own-availability alias on the team-scoped path.
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "Missing bearer token" });
});
