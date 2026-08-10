import test from "node:test";
import assert from "node:assert/strict";
import worker, {
  handleCreateTeamRequest,
  handleGetOwnProfileRequest,
  handleInvitePlayerToTeamRequest,
  handlePublishScheduleRequest,
  handleRespondToTeamInvitationRequest,
  handleSaveOwnProfileRequest,
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

test("own profile handler returns the authenticated player's profile", async () => {
  const { fetch, calls } = createFetch([
    { body: { id: "user-1", email: "player@example.com" } },
    { body: [{ id: "player-1", user_id: "user-1", display_name: "Kai" }] },
  ]);
  const request = new Request("https://fremontderby.com/api/me/profile", {
    headers: { authorization: "Bearer user-token" },
  });

  const response = await handleGetOwnProfileRequest(request, publishEnv, { fetch });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    profile: { id: "player-1", user_id: "user-1", display_name: "Kai" },
  });
  assert.equal(calls[0].url, "https://project.supabase.co/auth/v1/user");
  assert.equal(
    calls[1].url,
    "https://project.supabase.co/rest/v1/players?user_id=eq.user-1&select=id,user_id,display_name",
  );
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

test("team creation handler authenticates and creates a captain team", async () => {
  const { fetch, calls } = createFetch([
    { body: { id: "user-1", email: "player@example.com" } },
    {
      body: [{
        id: "team-1",
        season_id: "season-1",
        name: "Breakers",
        captain_player_id: "player-1",
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

  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), {
    team: {
      id: "team-1",
      season_id: "season-1",
      name: "Breakers",
      captain_player_id: "player-1",
    },
  });
  assert.equal(calls[0].url, "https://project.supabase.co/auth/v1/user");
  assert.equal(calls[1].url, "https://project.supabase.co/rest/v1/rpc/create_team_with_captain");
  assert.deepEqual(JSON.parse(calls[1].init.body), {
    actor_user_id: "user-1",
    target_season_id: "season-1",
    team_name: "Breakers",
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
