import {
  listTeamRoundAvailabilityCommand,
  setRosterAvailabilityCommand,
} from './availabilityCommands.js';
import { createAvailabilityRepository } from './availabilityRepository.js';
import {
  listEligibleFreeAgentsCommand,
  registerFreeAgentCommand,
  setFreeAgentAvailabilityCommand,
} from './freeAgentCommands.js';
import { createFreeAgentRepository } from './freeAgentRepository.js';
import {
  listVisibleTeamLineupsCommand,
  submitTeamLineupCommand,
} from './lineupCommands.js';
import { createLineupRepository } from './lineupRepository.js';
import {
  getOwnPlayerProfileCommand,
  saveOwnPlayerProfileCommand,
} from './playerProfileCommands.js';
import { createPlayerProfileRepository } from './playerProfileRepository.js';
import {
  correctPlayerMatchCommand,
  finalizePlayerMatchCommand,
  getPlayerMatchScorecardCommand,
  recordPlayerMatchRackCommand,
  undoPlayerMatchRackCommand,
} from './scoringCommands.js';
import { createScoringRepository } from './scoringRepository.js';
import { renderScorecardPage } from './scorecardPage.js';
import { publishSeasonScheduleCommand } from './seasonCommands.js';
import {
  listIndividualStandingsCommand,
  listTeamStandingsCommand,
} from './standingsCommands.js';
import { createStandingsRepository } from './standingsRepository.js';
import { AuthError, authenticateSupabaseUser } from './supabaseAuth.js';
import { createSupabaseSeasonRepository } from './supabaseSeasonRepository.js';
import {
  cancelTeamInvitationCommand,
  createTeamWithCaptainCommand,
  invitePlayerToTeamCommand,
  removeTeamMemberCommand,
  respondToTeamInvitationCommand,
} from './teamCommands.js';
import { createTeamRepository } from './teamRepository.js';

const serviceName = "fremontderby";

function versionMetadata(env = {}) {
  const metadata = env.CF_VERSION_METADATA || {};
  return {
    id: metadata.id || "local",
    tag: metadata.tag || null,
    timestamp: metadata.timestamp || null,
  };
}

export function renderLandingPage(env = {}) {
  const version = versionMetadata(env);
  const versionLabel = version.id === "local" ? "local development" : version.id;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Fremont Derby</title>
  <style>
    :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #07150f; color: #f4f7f5; }
    main { width: min(680px, calc(100% - 32px)); border: 1px solid #315d45; border-radius: 18px; background: #0b2418; padding: 36px; box-shadow: inset 0 0 0 6px #132d20; }
    .balls { display: flex; gap: 10px; margin-bottom: 24px; }
    .ball { width: 42px; height: 42px; border-radius: 50%; display: grid; place-items: center; font-weight: 800; color: #111; background: #fff; border: 3px solid #d9dedb; }
    .ball.nine { background: linear-gradient(#f4d64b 0 34%, #fff 34% 66%, #f4d64b 66%); }
    h1 { margin: 0; font-size: clamp(2.2rem, 8vw, 4.5rem); line-height: .95; letter-spacing: -.04em; }
    p { color: #b8c8be; line-height: 1.6; }
    code { color: #d4f6df; overflow-wrap: anywhere; }
    .status { margin-top: 28px; border-top: 1px solid #315d45; padding-top: 18px; font-size: .9rem; }
  </style>
</head>
<body>
  <main>
    <div class="balls" aria-hidden="true"><span class="ball">8</span><span class="ball nine">9</span></div>
    <h1>Fremont Derby</h1>
    <p>The deployment path is working. League development starts here.</p>
    <div class="status">Worker version: <code>${versionLabel}</code></div>
  </main>
</body>
</html>`;
}

function jsonResponse(body, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store",
    },
  });
}

async function readJsonBody(request) {
  try {
    const body = await request.json();
    if (!body || Array.isArray(body) || typeof body !== "object") {
      throw new Error("Request body must be a JSON object");
    }
    return body;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("Request body must be valid JSON");
    }
    throw error;
  }
}

function statusForError(error) {
  if (error instanceof AuthError) return error.status;
  if (error.message === "Season not found") return 404;
  if (error.message === "Actor is not a league admin") return 403;
  if (error.message.includes("Actor is not a league admin")) return 403;
  if (error.message.includes("Only the active captain")) return 403;
  if (error.message.includes("Active roster membership is required")) return 403;
  if (error.message.startsWith("Supabase request failed with 401")) return 401;
  if (error.message.startsWith("Supabase request failed with 403")) return 403;
  if (error.message.includes("Player is already scheduled")) return 409;
  if (error.message.includes("Only match players or active team captains")) return 403;
  if (error.message.includes("already complete")) return 409;
  if (error.message.includes("is finalized")) return 409;
  if (error.message.includes("no racks to undo")) return 409;
  if (error.message.includes("before finalization")) return 409;
  if (error.message.includes("before correction")) return 409;
  if (error.message.includes("valid completed race state")) return 409;
  if (error.message.includes("valid corrected race state")) return 409;
  if (error.message.includes("rack history must match")) return 409;
  if (error.message.includes("Race targets are required")) return 409;
  if (error.message === "Player match not found") return 404;
  return 400;
}

export async function handlePublishScheduleRequest(
  request,
  env,
  seasonId,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const body = await readJsonBody(request);
    if (!body.firstRoundDate) {
      throw new Error("firstRoundDate is required");
    }

    const repository = createSupabaseSeasonRepository(env, { fetch: fetchImpl });
    const result = await publishSeasonScheduleCommand(
      {
        seasonId,
        actorUserId: actor.id,
        firstRoundDate: body.firstRoundDate,
        intervalDays: body.intervalDays,
        tableNumbers: body.tableNumbers,
      },
      repository,
    );

    return jsonResponse(result, 201);
  } catch (error) {
    return jsonResponse({ error: error.message }, statusForError(error));
  }
}

export async function handleGetOwnProfileRequest(
  request,
  env,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const repository = createPlayerProfileRepository(env, { fetch: fetchImpl });
    const profile = await getOwnPlayerProfileCommand(
      { actorUserId: actor.id },
      repository,
    );

    return jsonResponse({ profile });
  } catch (error) {
    return jsonResponse({ error: error.message }, statusForError(error));
  }
}

export async function handleSaveOwnProfileRequest(
  request,
  env,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const body = await readJsonBody(request);
    const repository = createPlayerProfileRepository(env, { fetch: fetchImpl });
    const profile = await saveOwnPlayerProfileCommand(
      {
        actorUserId: actor.id,
        displayName: body.displayName,
      },
      repository,
    );

    return jsonResponse({ profile });
  } catch (error) {
    return jsonResponse({ error: error.message }, statusForError(error));
  }
}

export async function handleCreateTeamRequest(
  request,
  env,
  seasonId,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const body = await readJsonBody(request);
    const repository = createTeamRepository(env, { fetch: fetchImpl });
    const team = await createTeamWithCaptainCommand(
      {
        actorUserId: actor.id,
        seasonId,
        teamName: body.teamName ?? body.name,
      },
      repository,
    );

    return jsonResponse({ team }, 201);
  } catch (error) {
    return jsonResponse({ error: error.message }, statusForError(error));
  }
}

export async function handleInvitePlayerToTeamRequest(
  request,
  env,
  teamId,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const body = await readJsonBody(request);
    const repository = createTeamRepository(env, { fetch: fetchImpl });
    const invitation = await invitePlayerToTeamCommand(
      {
        actorUserId: actor.id,
        teamId,
        playerId: body.playerId ?? body.invitedPlayerId,
      },
      repository,
    );

    return jsonResponse({ invitation }, 201);
  } catch (error) {
    return jsonResponse({ error: error.message }, statusForError(error));
  }
}

export async function handleRespondToTeamInvitationRequest(
  request,
  env,
  invitationId,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const body = await readJsonBody(request);
    const repository = createTeamRepository(env, { fetch: fetchImpl });
    const invitation = await respondToTeamInvitationCommand(
      {
        actorUserId: actor.id,
        invitationId,
        response: body.response,
      },
      repository,
    );

    return jsonResponse({ invitation });
  } catch (error) {
    return jsonResponse({ error: error.message }, statusForError(error));
  }
}

export async function handleCancelTeamInvitationRequest(
  request,
  env,
  invitationId,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const repository = createTeamRepository(env, { fetch: fetchImpl });
    const invitation = await cancelTeamInvitationCommand(
      {
        actorUserId: actor.id,
        invitationId,
      },
      repository,
    );

    return jsonResponse({ invitation });
  } catch (error) {
    return jsonResponse({ error: error.message }, statusForError(error));
  }
}

export async function handleRemoveTeamMemberRequest(
  request,
  env,
  membershipId,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const repository = createTeamRepository(env, { fetch: fetchImpl });
    const membership = await removeTeamMemberCommand(
      {
        actorUserId: actor.id,
        membershipId,
      },
      repository,
    );

    return jsonResponse({ membership });
  } catch (error) {
    return jsonResponse({ error: error.message }, statusForError(error));
  }
}

export async function handleRegisterFreeAgentRequest(
  request,
  env,
  seasonId,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const repository = createFreeAgentRepository(env, { fetch: fetchImpl });
    const freeAgent = await registerFreeAgentCommand(
      {
        actorUserId: actor.id,
        seasonId,
      },
      repository,
    );

    return jsonResponse({ freeAgent }, 201);
  } catch (error) {
    return jsonResponse({ error: error.message }, statusForError(error));
  }
}

export async function handleSetFreeAgentAvailabilityRequest(
  request,
  env,
  roundId,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const body = await readJsonBody(request);
    const repository = createFreeAgentRepository(env, { fetch: fetchImpl });
    const availability = await setFreeAgentAvailabilityCommand(
      {
        actorUserId: actor.id,
        roundId,
        availabilityStatus: body.status ?? body.availabilityStatus,
      },
      repository,
    );

    return jsonResponse({ availability });
  } catch (error) {
    return jsonResponse({ error: error.message }, statusForError(error));
  }
}

export async function handleListEligibleFreeAgentsRequest(
  request,
  env,
  { teamId, roundId },
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const repository = createFreeAgentRepository(env, { fetch: fetchImpl });
    const freeAgents = await listEligibleFreeAgentsCommand(
      {
        actorUserId: actor.id,
        teamId,
        roundId,
      },
      repository,
    );

    return jsonResponse({ freeAgents });
  } catch (error) {
    return jsonResponse({ error: error.message }, statusForError(error));
  }
}

export async function handleSetRosterAvailabilityRequest(
  request,
  env,
  roundId,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const body = await readJsonBody(request);
    const repository = createAvailabilityRepository(env, { fetch: fetchImpl });
    const availability = await setRosterAvailabilityCommand(
      {
        actorUserId: actor.id,
        roundId,
        availabilityStatus: body.status ?? body.availabilityStatus,
      },
      repository,
    );

    return jsonResponse({ availability });
  } catch (error) {
    return jsonResponse({ error: error.message }, statusForError(error));
  }
}

export async function handleListTeamRoundAvailabilityRequest(
  request,
  env,
  { teamId, roundId },
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const repository = createAvailabilityRepository(env, { fetch: fetchImpl });
    const availability = await listTeamRoundAvailabilityCommand(
      {
        actorUserId: actor.id,
        teamId,
        roundId,
      },
      repository,
    );

    return jsonResponse({ availability });
  } catch (error) {
    return jsonResponse({ error: error.message }, statusForError(error));
  }
}

export async function handleSubmitTeamLineupRequest(
  request,
  env,
  { teamId, roundId },
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const body = await readJsonBody(request);
    const repository = createLineupRepository(env, { fetch: fetchImpl });
    const lineup = await submitTeamLineupCommand(
      {
        actorUserId: actor.id,
        teamId,
        roundId,
        slots: body.slots ?? body.lineupSlots,
      },
      repository,
    );

    return jsonResponse({ lineup });
  } catch (error) {
    return jsonResponse({ error: error.message }, statusForError(error));
  }
}

export async function handleListVisibleTeamLineupsRequest(
  request,
  env,
  { teamId, roundId },
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const repository = createLineupRepository(env, { fetch: fetchImpl });
    const lineups = await listVisibleTeamLineupsCommand(
      {
        actorUserId: actor.id,
        teamId,
        roundId,
      },
      repository,
    );

    return jsonResponse({ lineups });
  } catch (error) {
    return jsonResponse({ error: error.message }, statusForError(error));
  }
}

export async function handleListTeamStandingsRequest(
  env,
  seasonId,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const repository = createStandingsRepository(env, { fetch: fetchImpl });
    const standings = await listTeamStandingsCommand(
      { seasonId },
      repository,
    );

    return jsonResponse({ standings });
  } catch (error) {
    return jsonResponse({ error: error.message }, statusForError(error));
  }
}

export async function handleListIndividualStandingsRequest(
  env,
  seasonId,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const repository = createStandingsRepository(env, { fetch: fetchImpl });
    const standings = await listIndividualStandingsCommand(
      { seasonId },
      repository,
    );

    return jsonResponse({ standings });
  } catch (error) {
    return jsonResponse({ error: error.message }, statusForError(error));
  }
}

export async function handleGetPlayerMatchScorecardRequest(
  request,
  env,
  playerMatchId,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const repository = createScoringRepository(env, { fetch: fetchImpl });
    const scorecard = await getPlayerMatchScorecardCommand(
      {
        actorUserId: actor.id,
        playerMatchId,
      },
      repository,
    );

    return jsonResponse({ scorecard });
  } catch (error) {
    return jsonResponse({ error: error.message }, statusForError(error));
  }
}

export async function handleRecordPlayerMatchRackRequest(
  request,
  env,
  playerMatchId,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const body = await readJsonBody(request);
    const repository = createScoringRepository(env, { fetch: fetchImpl });
    const rack = await recordPlayerMatchRackCommand(
      {
        actorUserId: actor.id,
        playerMatchId,
        winnerSide: body.winnerSide ?? body.winner,
      },
      repository,
    );

    return jsonResponse({ rack }, 201);
  } catch (error) {
    return jsonResponse({ error: error.message }, statusForError(error));
  }
}

export async function handleUndoPlayerMatchRackRequest(
  request,
  env,
  playerMatchId,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const repository = createScoringRepository(env, { fetch: fetchImpl });
    const undo = await undoPlayerMatchRackCommand(
      {
        actorUserId: actor.id,
        playerMatchId,
      },
      repository,
    );

    return jsonResponse({ undo });
  } catch (error) {
    return jsonResponse({ error: error.message }, statusForError(error));
  }
}

export async function handleFinalizePlayerMatchRequest(
  request,
  env,
  playerMatchId,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const repository = createScoringRepository(env, { fetch: fetchImpl });
    const match = await finalizePlayerMatchCommand(
      {
        actorUserId: actor.id,
        playerMatchId,
      },
      repository,
    );

    return jsonResponse({ match });
  } catch (error) {
    return jsonResponse({ error: error.message }, statusForError(error));
  }
}

export async function handleCorrectPlayerMatchRequest(
  request,
  env,
  playerMatchId,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const body = await readJsonBody(request);
    const repository = createScoringRepository(env, { fetch: fetchImpl });
    const match = await correctPlayerMatchCommand(
      {
        actorUserId: actor.id,
        playerMatchId,
        winnerSide: body.winnerSide ?? body.winner,
        scoreA: body.scoreA ?? body.score_a,
        scoreB: body.scoreB ?? body.score_b,
        reason: body.reason ?? body.correctionReason,
        racks: body.racks ?? body.correctedRacks,
      },
      repository,
    );

    return jsonResponse({ match });
  } catch (error) {
    return jsonResponse({ error: error.message }, statusForError(error));
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const version = versionMetadata(env);
    const publishScheduleMatch = url.pathname.match(
      /^\/api\/admin\/seasons\/([^/]+)\/publish-schedule$/,
    );
    const createTeamMatch = url.pathname.match(
      /^\/api\/seasons\/([^/]+)\/teams$/,
    );
    const teamInvitationMatch = url.pathname.match(
      /^\/api\/teams\/([^/]+)\/invitations$/,
    );
    const invitationResponseMatch = url.pathname.match(
      /^\/api\/team-invitations\/([^/]+)\/respond$/,
    );
    const invitationCancelMatch = url.pathname.match(
      /^\/api\/team-invitations\/([^/]+)\/cancel$/,
    );
    const teamMemberRemoveMatch = url.pathname.match(
      /^\/api\/team-memberships\/([^/]+)\/remove$/,
    );
    const registerFreeAgentMatch = url.pathname.match(
      /^\/api\/seasons\/([^/]+)\/free-agents\/me$/,
    );
    const freeAgentAvailabilityMatch = url.pathname.match(
      /^\/api\/rounds\/([^/]+)\/free-agent-availability\/me$/,
    );
    const rosterAvailabilityMatch = url.pathname.match(
      /^\/api\/rounds\/([^/]+)\/availability\/me$/,
    );
    const eligibleFreeAgentsMatch = url.pathname.match(
      /^\/api\/teams\/([^/]+)\/rounds\/([^/]+)\/eligible-free-agents$/,
    );
    const teamRoundAvailabilityMatch = url.pathname.match(
      /^\/api\/teams\/([^/]+)\/rounds\/([^/]+)\/availability$/,
    );
    const teamLineupMatch = url.pathname.match(
      /^\/api\/teams\/([^/]+)\/rounds\/([^/]+)\/lineup$/,
    );
    const teamStandingsMatch = url.pathname.match(
      /^\/api\/seasons\/([^/]+)\/team-standings$/,
    );
    const individualStandingsMatch = url.pathname.match(
      /^\/api\/seasons\/([^/]+)\/individual-standings$/,
    );
    const playerMatchScorecardMatch = url.pathname.match(
      /^\/api\/player-matches\/([^/]+)\/scorecard$/,
    );
    const playerMatchRackMatch = url.pathname.match(
      /^\/api\/player-matches\/([^/]+)\/racks$/,
    );
    const playerMatchRackUndoMatch = url.pathname.match(
      /^\/api\/player-matches\/([^/]+)\/racks\/undo$/,
    );
    const playerMatchFinalizeMatch = url.pathname.match(
      /^\/api\/player-matches\/([^/]+)\/finalize$/,
    );
    const playerMatchCorrectMatch = url.pathname.match(
      /^\/api\/player-matches\/([^/]+)\/correct$/,
    );

    if (url.pathname === "/health") {
      return Response.json(
        {
          ok: true,
          service: serviceName,
          version: version.id,
          versionTag: version.tag,
          deployedAt: version.timestamp,
        },
        { headers: { "cache-control": "no-store" } },
      );
    }

    if (url.pathname === "/scorecard") {
      if (request.method !== "GET") {
        return jsonResponse({ error: "Method not allowed" }, 405);
      }

      return new Response(renderScorecardPage(), {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
        },
      });
    }

    if (publishScheduleMatch) {
      if (request.method !== "POST") {
        return jsonResponse({ error: "Method not allowed" }, 405);
      }

      return handlePublishScheduleRequest(
        request,
        env,
        decodeURIComponent(publishScheduleMatch[1]),
      );
    }

    if (url.pathname === "/api/me/profile") {
      if (request.method === "GET") {
        return handleGetOwnProfileRequest(request, env);
      }
      if (request.method === "PUT") {
        return handleSaveOwnProfileRequest(request, env);
      }

      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    if (createTeamMatch) {
      if (request.method !== "POST") {
        return jsonResponse({ error: "Method not allowed" }, 405);
      }

      return handleCreateTeamRequest(
        request,
        env,
        decodeURIComponent(createTeamMatch[1]),
      );
    }

    if (teamInvitationMatch) {
      if (request.method !== "POST") {
        return jsonResponse({ error: "Method not allowed" }, 405);
      }

      return handleInvitePlayerToTeamRequest(
        request,
        env,
        decodeURIComponent(teamInvitationMatch[1]),
      );
    }

    if (invitationResponseMatch) {
      if (request.method !== "POST") {
        return jsonResponse({ error: "Method not allowed" }, 405);
      }

      return handleRespondToTeamInvitationRequest(
        request,
        env,
        decodeURIComponent(invitationResponseMatch[1]),
      );
    }

    if (invitationCancelMatch) {
      if (request.method !== "POST") {
        return jsonResponse({ error: "Method not allowed" }, 405);
      }

      return handleCancelTeamInvitationRequest(
        request,
        env,
        decodeURIComponent(invitationCancelMatch[1]),
      );
    }

    if (teamMemberRemoveMatch) {
      if (request.method !== "POST") {
        return jsonResponse({ error: "Method not allowed" }, 405);
      }

      return handleRemoveTeamMemberRequest(
        request,
        env,
        decodeURIComponent(teamMemberRemoveMatch[1]),
      );
    }

    if (registerFreeAgentMatch) {
      if (request.method !== "POST") {
        return jsonResponse({ error: "Method not allowed" }, 405);
      }

      return handleRegisterFreeAgentRequest(
        request,
        env,
        decodeURIComponent(registerFreeAgentMatch[1]),
      );
    }

    if (freeAgentAvailabilityMatch) {
      if (request.method !== "PUT") {
        return jsonResponse({ error: "Method not allowed" }, 405);
      }

      return handleSetFreeAgentAvailabilityRequest(
        request,
        env,
        decodeURIComponent(freeAgentAvailabilityMatch[1]),
      );
    }

    if (rosterAvailabilityMatch) {
      if (request.method !== "PUT") {
        return jsonResponse({ error: "Method not allowed" }, 405);
      }

      return handleSetRosterAvailabilityRequest(
        request,
        env,
        decodeURIComponent(rosterAvailabilityMatch[1]),
      );
    }

    if (eligibleFreeAgentsMatch) {
      if (request.method !== "GET") {
        return jsonResponse({ error: "Method not allowed" }, 405);
      }

      return handleListEligibleFreeAgentsRequest(
        request,
        env,
        {
          teamId: decodeURIComponent(eligibleFreeAgentsMatch[1]),
          roundId: decodeURIComponent(eligibleFreeAgentsMatch[2]),
        },
      );
    }

    if (teamRoundAvailabilityMatch) {
      if (request.method !== "GET") {
        return jsonResponse({ error: "Method not allowed" }, 405);
      }

      return handleListTeamRoundAvailabilityRequest(
        request,
        env,
        {
          teamId: decodeURIComponent(teamRoundAvailabilityMatch[1]),
          roundId: decodeURIComponent(teamRoundAvailabilityMatch[2]),
        },
      );
    }

    if (teamLineupMatch) {
      if (request.method === "GET") {
        return handleListVisibleTeamLineupsRequest(
          request,
          env,
          {
            teamId: decodeURIComponent(teamLineupMatch[1]),
            roundId: decodeURIComponent(teamLineupMatch[2]),
          },
        );
      }
      if (request.method === "POST") {
        return handleSubmitTeamLineupRequest(
          request,
          env,
          {
            teamId: decodeURIComponent(teamLineupMatch[1]),
            roundId: decodeURIComponent(teamLineupMatch[2]),
          },
        );
      }

      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    if (teamStandingsMatch) {
      if (request.method !== "GET") {
        return jsonResponse({ error: "Method not allowed" }, 405);
      }

      return handleListTeamStandingsRequest(
        env,
        decodeURIComponent(teamStandingsMatch[1]),
      );
    }

    if (individualStandingsMatch) {
      if (request.method !== "GET") {
        return jsonResponse({ error: "Method not allowed" }, 405);
      }

      return handleListIndividualStandingsRequest(
        env,
        decodeURIComponent(individualStandingsMatch[1]),
      );
    }

    if (playerMatchScorecardMatch) {
      if (request.method !== "GET") {
        return jsonResponse({ error: "Method not allowed" }, 405);
      }

      return handleGetPlayerMatchScorecardRequest(
        request,
        env,
        decodeURIComponent(playerMatchScorecardMatch[1]),
      );
    }

    if (playerMatchRackMatch) {
      if (request.method !== "POST") {
        return jsonResponse({ error: "Method not allowed" }, 405);
      }

      return handleRecordPlayerMatchRackRequest(
        request,
        env,
        decodeURIComponent(playerMatchRackMatch[1]),
      );
    }

    if (playerMatchRackUndoMatch) {
      if (request.method !== "POST") {
        return jsonResponse({ error: "Method not allowed" }, 405);
      }

      return handleUndoPlayerMatchRackRequest(
        request,
        env,
        decodeURIComponent(playerMatchRackUndoMatch[1]),
      );
    }

    if (playerMatchFinalizeMatch) {
      if (request.method !== "POST") {
        return jsonResponse({ error: "Method not allowed" }, 405);
      }

      return handleFinalizePlayerMatchRequest(
        request,
        env,
        decodeURIComponent(playerMatchFinalizeMatch[1]),
      );
    }

    if (playerMatchCorrectMatch) {
      if (request.method !== "POST") {
        return jsonResponse({ error: "Method not allowed" }, 405);
      }

      return handleCorrectPlayerMatchRequest(
        request,
        env,
        decodeURIComponent(playerMatchCorrectMatch[1]),
      );
    }

    if (url.pathname.startsWith("/api/")) {
      return jsonResponse({ error: "Not found" }, 404);
    }

    return new Response(renderLandingPage(env), {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  },
};
