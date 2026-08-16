import { createNotificationRepository } from './notificationRepository.js';
import {
  createAdminAuditRepository,
  deliverAuditWebhooks,
} from './adminAuditRepository.js';
import { createChatRepository } from './chatRepository.js';
import { apiSecurityHeaders, assertBetaBypassLane } from './securityHeaders.js';
import { rpcErrorStatus } from './rpcErrorStatus.js';
import {
  readSanitizedJsonBody,
  safeClientErrorMessage,
  requireUuid,
  isUuid,
} from './requestSanitize.js';
import {
  listTeamRoundAvailabilityCommand,
  setRosterAvailabilityCommand,
} from './availabilityCommands.js';
import { renderAvailabilityPage } from './availabilityPage.js';
import { createAvailabilityRepository } from './availabilityRepository.js';
import {
  listEligibleFreeAgentsCommand,
  registerFreeAgentCommand,
  setFreeAgentAvailabilityCommand,
} from './freeAgentCommands.js';
import { createFreeAgentRepository } from './freeAgentRepository.js';
import { environmentReadiness } from './environmentReadiness.js';
import {
  listVisibleTeamLineupsCommand,
  submitTeamLineupCommand,
} from './lineupCommands.js';
import { renderLineupPage } from './lineupPage.js';
import { createLineupRepository } from './lineupRepository.js';
import {
  getOwnPlayerProfileCommand,
  saveOwnPlayerProfileCommand,
  saveOwnStandingAvailabilityCommand,
} from './playerProfileCommands.js';
import { renderProfilePage } from './profilePage.js';
import { createPlayerProfileRepository } from './playerProfileRepository.js';
import {
  configureSeasonPrizesCommand,
  finalizeSeasonPrizePayoutsCommand,
  getSeasonPrizeSummaryCommand,
} from './prizeCommands.js';
import { renderPrizesPage } from './prizesPage.js';
import { createPrizeRepository } from './prizeRepository.js';
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
  getSeasonSetupCommand,
  saveSeasonSetupCommand,
} from './seasonSetupCommands.js';
import { renderSeasonSetupPage } from './seasonSetupPage.js';
import {
  listIndividualStandingsCommand,
  listTeamStandingsCommand,
} from './standingsCommands.js';
import { renderPlayersDirectoryPage } from './playersDirectoryPage.js';
import { renderStandingsPage } from './standingsPage.js';
import { createStandingsRepository } from './standingsRepository.js';
import { conditionalJsonFromVersion, conditionalJsonResponse, versionTokenFromValue } from './httpConditional.js';
import { AuthError, authenticateSupabaseUser } from './supabaseAuth.js';
import { createSupabaseSeasonRepository } from './supabaseSeasonRepository.js';
import {
  adminProposeTeamTradeExceptionCommand,
  approveTeamTradeCaptainCommand,
  cancelTeamInvitationCommand,
  invitePlayerToTeamCommand,
  updateTeamPracticeCommand,
  listOwnTeamManagementCommand,
  listOwnTeamTradesCommand,
  listTradeCounterpartyOptionsCommand,
  proposeTeamTradeCommand,
  removeTeamMemberCommand,
  respondToTeamTradePlayerCommand,
  respondToTeamInvitationCommand,
} from './teamCommands.js';
import {
  proposeTeamMatchMakeupCommand,
  respondTeamMatchMakeupCommand,
} from './makeupCommands.js';
import {
  listMyNotificationsCommand,
  markNotificationReadCommand,
  markAllNotificationsReadCommand,
  adminBroadcastNotificationCommand,
} from './notificationCommands.js';
import { createTeamMembershipRequestRepository } from './teamMembershipRequestRepository.js';
import { createTeamRepository } from './teamRepository.js';
import {
  configureSeasonRegistrationCommand,
  getAdminSeasonRegistrationCommand,
  getOwnTeamRegistrationCommand,
  manageTeamSlotCommand,
  respondToReturningTeamSlotCommand,
  reviewTeamApplicationCommand,
  seedReturningTeamSlotsCommand,
  submitTeamApplicationCommand,
  withdrawTeamApplicationCommand,
} from './teamRegistrationCommands.js';
import { createTeamRegistrationRepository } from './teamRegistrationRepository.js';
import { renderTeamsPage } from './teamsPage.js';
import { renderTradesPage } from './tradesPage.js';

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
  return Response.json(body, { status, headers: apiSecurityHeaders() });
}

async function readJsonBody(request) {
  return readSanitizedJsonBody(request);
}

function normalizeApproveDecline(body) {
  const raw =
    body?.response
    ?? body?.decision
    ?? body?.action
    ?? (body?.accept === true || body?.accepted === true ? 'approved' : null)
    ?? (body?.decline === true || body?.declined === true ? 'declined' : null);
  return raw == null ? raw : String(raw).toLowerCase();
}

function clientErrorMessage(error) {
  // Prefer safe mapping first, then preserve a few product-specific uuid phrases.
  const safe = safeClientErrorMessage(error);
  const raw = String(error?.message || '');
  if (/invalid input syntax for type uuid/i.test(raw) || /Supabase request failed with 400:.*uuid/i.test(raw)) {
    return 'That season or match link is invalid.';
  }
  return safe;
}
function statusForError(error) {
  if (error instanceof AuthError) return error.status;
  return rpcErrorStatus(error);
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
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
  }
}

export async function handleCreateSeasonSetupRequest(
  request,
  env,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const body = await readJsonBody(request);
    const repository = createSupabaseSeasonRepository(env, { fetch: fetchImpl });
    const setup = await saveSeasonSetupCommand(
      {
        actorUserId: actor.id,
        seasonName: body.seasonName ?? body.season_name,
        leagueNight: body.leagueNight ?? body.league_night,
        firstRoundDate: body.firstRoundDate ?? body.first_round_date,
        rosterLockRound: body.rosterLockRound ?? body.roster_lock_round,
        openingBlockLength: body.openingBlockLength ?? body.opening_block_length,
        individualMinMatches: body.individualMinMatches ?? body.individual_min_matches,
        roundIntervalDays: body.roundIntervalDays ?? body.round_interval_days,
        tableNumbers: body.tableNumbers ?? body.table_numbers,
        raceChartVersion: body.raceChartVersion ?? body.race_chart_version,
        playoffTeamCount: body.playoffTeamCount ?? body.playoff_team_count,
        playoffAnchorTiebreaker: body.playoffAnchorTiebreaker
          ?? body.playoff_anchor_tiebreaker,
      },
      repository,
    );

    return jsonResponse({ setup }, 201);
  } catch (error) {
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
  }
}

export async function handleListAdminSeasonsRequest(
  request,
  env,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const repository = createSupabaseSeasonRepository(env, { fetch: fetchImpl });
    const seasons = await repository.listAdminSeasons({ actorUserId: actor.id });
    return jsonResponse({ seasons });
  } catch (error) {
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
  }
}

export async function handleGetSeasonSetupRequest(
  request,
  env,
  seasonId,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const repository = createSupabaseSeasonRepository(env, { fetch: fetchImpl });
    const setup = await getSeasonSetupCommand(
      {
        actorUserId: actor.id,
        seasonId,
      },
      repository,
    );

    return jsonResponse({ setup });
  } catch (error) {
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
  }
}

export async function handleUpdateSeasonSetupRequest(
  request,
  env,
  seasonId,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const body = await readJsonBody(request);
    const repository = createSupabaseSeasonRepository(env, { fetch: fetchImpl });
    const setup = await saveSeasonSetupCommand(
      {
        actorUserId: actor.id,
        seasonId,
        seasonName: body.seasonName ?? body.season_name,
        leagueNight: body.leagueNight ?? body.league_night,
        firstRoundDate: body.firstRoundDate ?? body.first_round_date,
        rosterLockRound: body.rosterLockRound ?? body.roster_lock_round,
        openingBlockLength: body.openingBlockLength ?? body.opening_block_length,
        individualMinMatches: body.individualMinMatches ?? body.individual_min_matches,
        roundIntervalDays: body.roundIntervalDays ?? body.round_interval_days,
        tableNumbers: body.tableNumbers ?? body.table_numbers,
        raceChartVersion: body.raceChartVersion ?? body.race_chart_version,
        playoffTeamCount: body.playoffTeamCount ?? body.playoff_team_count,
        playoffAnchorTiebreaker: body.playoffAnchorTiebreaker
          ?? body.playoff_anchor_tiebreaker,
      },
      repository,
    );

    return jsonResponse({ setup });
  } catch (error) {
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
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
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
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
    // Standing-only payloads used to 400 with "displayName is required". Accept either shape.
    const standingOnly =
      (body.standingStatus != null || body.standing_availability_status != null
        || body.standingNote != null || body.standing_availability_note != null)
      && body.displayName == null && body.display_name == null;
    if (standingOnly) {
      const profile = await saveOwnStandingAvailabilityCommand(
        {
          actorUserId: actor.id,
          standingStatus: body.standingStatus ?? body.standing_availability_status,
          standingNote: body.standingNote ?? body.standing_availability_note,
        },
        repository,
      );
      return jsonResponse({ profile });
    }
    const profile = await saveOwnPlayerProfileCommand(
      {
        actorUserId: actor.id,
        displayName: body.displayName ?? body.display_name,
      },
      repository,
    );

    return jsonResponse({ profile });
  } catch (error) {
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
  }
}

export async function handleSaveOwnStandingAvailabilityRequest(
  request,
  env,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const body = await readJsonBody(request);
    const repository = createPlayerProfileRepository(env, { fetch: fetchImpl });
    const profile = await saveOwnStandingAvailabilityCommand(
      {
        actorUserId: actor.id,
        standingStatus: body.standingStatus ?? body.standing_availability_status,
        standingNote: body.standingNote ?? body.standing_availability_note,
      },
      repository,
    );

    return jsonResponse({ profile });
  } catch (error) {
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
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
    const repository = createTeamRegistrationRepository(env, { fetch: fetchImpl });
    const application = await submitTeamApplicationCommand(
      {
        actorUserId: actor.id,
        seasonId,
        teamName: body.teamName ?? body.team_name ?? body.name,
      },
      repository,
    );

    return jsonResponse({ application }, 202);
  } catch (error) {
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
  }
}

export async function handleGetOwnTeamRegistrationRequest(
  request,
  env,
  seasonId,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const repository = createTeamRegistrationRepository(env, { fetch: fetchImpl });
    const registration = await getOwnTeamRegistrationCommand(
      { actorUserId: actor.id, seasonId },
      repository,
    );
    return jsonResponse({ registration });
  } catch (error) {
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
  }
}

export async function handleWithdrawTeamApplicationRequest(
  request,
  env,
  applicationId,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const repository = createTeamRegistrationRepository(env, { fetch: fetchImpl });
    const application = await withdrawTeamApplicationCommand(
      { actorUserId: actor.id, applicationId },
      repository,
    );
    return jsonResponse({ application });
  } catch (error) {
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
  }
}

export async function handleRespondToReturningTeamSlotRequest(
  request,
  env,
  slotId,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const body = await readJsonBody(request);
    const repository = createTeamRegistrationRepository(env, { fetch: fetchImpl });
    const slot = await respondToReturningTeamSlotCommand(
      {
        actorUserId: actor.id,
        slotId,
        action: body.action ?? body.response ?? body.decision
          ?? (body.accept === true || body.accepted === true ? 'accept' : null)
          ?? (body.decline === true || body.declined === true ? 'decline' : null),
        transferPlayerId: body.transferPlayerId ?? body.transfer_player_id,
      },
      repository,
    );
    return jsonResponse({ slot });
  } catch (error) {
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
  }
}

export async function handleGetAdminSeasonRegistrationRequest(
  request,
  env,
  seasonId,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const repository = createTeamRegistrationRepository(env, { fetch: fetchImpl });
    const registration = await getAdminSeasonRegistrationCommand(
      { actorUserId: actor.id, seasonId },
      repository,
    );
    return jsonResponse({ registration });
  } catch (error) {
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
  }
}

export async function handleConfigureSeasonRegistrationRequest(
  request,
  env,
  seasonId,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const body = await readJsonBody(request);
    const repository = createTeamRegistrationRepository(env, { fetch: fetchImpl });
    const registration = await configureSeasonRegistrationCommand(
      {
        actorUserId: actor.id,
        seasonId,
        teamCapacity: body.teamCapacity ?? body.team_capacity,
        minimumCommittedRoster:
          body.minimumCommittedRoster ?? body.minimum_committed_roster,
        returningReservationDeadline:
          body.returningReservationDeadline ?? body.returning_reservation_deadline,
        conditionalHoldDays: body.conditionalHoldDays ?? body.conditional_hold_days,
      },
      repository,
    );
    return jsonResponse({ registration });
  } catch (error) {
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
  }
}

export async function handleReviewTeamApplicationRequest(
  request,
  env,
  applicationId,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const body = await readJsonBody(request);
    const repository = createTeamRegistrationRepository(env, { fetch: fetchImpl });
    const application = await reviewTeamApplicationCommand(
      {
        actorUserId: actor.id,
        applicationId,
        decision: normalizeApproveDecline(body) ?? body.decision,
        reason: body.reason ?? body.note,
      },
      repository,
    );
    return jsonResponse({ application });
  } catch (error) {
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
  }
}

export async function handleManageTeamSlotRequest(
  request,
  env,
  slotId,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const body = await readJsonBody(request);
    const repository = createTeamRegistrationRepository(env, { fetch: fetchImpl });
    const slot = await manageTeamSlotCommand(
      {
        actorUserId: actor.id,
        slotId,
        action: body.action ?? body.decision ?? body.response,
        reason: body.reason ?? body.note,
        extensionDays: body.extensionDays ?? body.extension_days,
      },
      repository,
    );
    return jsonResponse({ slot });
  } catch (error) {
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
  }
}

export async function handleSeedReturningTeamSlotsRequest(
  request,
  env,
  seasonId,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const body = await readJsonBody(request);
    const repository = createTeamRegistrationRepository(env, { fetch: fetchImpl });
    const slots = await seedReturningTeamSlotsCommand(
      {
        actorUserId: actor.id,
        seasonId,
        sourceSeasonId: body.sourceSeasonId ?? body.source_season_id,
      },
      repository,
    );
    return jsonResponse({ slots }, 201);
  } catch (error) {
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
  }
}

export async function handleListOwnTeamMembershipRequestsRequest(
  request,
  env,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const repository = createTeamMembershipRequestRepository(env, { fetch: fetchImpl });
    return jsonResponse({ requests: await repository.listOwn({ actorUserId: actor.id }) });
  } catch (error) {
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
  }
}

export async function handleRequestTeamMembershipRequest(
  request,
  env,
  teamId,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const repository = createTeamMembershipRequestRepository(env, { fetch: fetchImpl });
    const membershipRequest = await repository.requestJoin({ actorUserId: actor.id, teamId });
    return jsonResponse({ membershipRequest }, 201);
  } catch (error) {
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
  }
}

export async function handleRespondToTeamMembershipRequest(
  request,
  env,
  requestId,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const body = await readJsonBody(request);
    const response = normalizeApproveDecline(body);
    if (!['approved', 'declined'].includes(response)) {
      throw new Error('response must be approved or declined');
    }
    const repository = createTeamMembershipRequestRepository(env, { fetch: fetchImpl });
    const membershipRequest = await repository.respond({
      actorUserId: actor.id,
      requestId,
      response,
    });
    return jsonResponse({ membershipRequest });
  } catch (error) {
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
  }
}

export async function handleCancelTeamMembershipRequest(
  request,
  env,
  requestId,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const repository = createTeamMembershipRequestRepository(env, { fetch: fetchImpl });
    const membershipRequest = await repository.cancel({ actorUserId: actor.id, requestId });
    return jsonResponse({ membershipRequest });
  } catch (error) {
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
  }
}

export async function handleListOwnTeamManagementRequest(
  request,
  env,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const repository = createTeamRepository(env, { fetch: fetchImpl });
    // Actor-scoped: strong ETag after load still enables 304 bandwidth savings on live refresh.
    const teamManagement = await listOwnTeamManagementCommand(
      { actorUserId: actor.id },
      repository,
    );
    return conditionalJsonResponse(request, { teamManagement }, {
      cacheControl: 'private, no-store',
    });
  } catch (error) {
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
  }
}


export async function handleListTradeCounterpartyOptionsRequest(
  request,
  env,
  seasonId,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const repository = createTeamRepository(env, { fetch: fetchImpl });
    const teams = await listTradeCounterpartyOptionsCommand(
      { actorUserId: actor.id, seasonId },
      repository,
    );
    return jsonResponse({ teams });
  } catch (error) {
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
  }
}

export async function handleListOwnTeamTradesRequest(
  request,
  env,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const repository = createTeamRepository(env, { fetch: fetchImpl });
    const tradeManagement = await listOwnTeamTradesCommand(
      { actorUserId: actor.id },
      repository,
    );

    return jsonResponse({ tradeManagement });
  } catch (error) {
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
  }
}


export async function handleUpdateTeamPracticeRequest(
  request,
  env,
  teamId,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    if (request.method !== 'PUT' && request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const body = await readJsonBody(request);
    const repository = createTeamRepository(env, { fetch: fetchImpl });
    const chatRepository = createChatRepository(env, { fetch: fetchImpl });
    const practice = await updateTeamPracticeCommand(
      {
        actorUserId: actor.id,
        teamId,
        practiceLocation: body.practiceLocation ?? body.practice_location ?? body.location ?? null,
        practiceSchedule: body.practiceSchedule ?? body.practice_schedule ?? body.time ?? body.schedule ?? null,
        practiceRecurrence: body.practiceRecurrence ?? body.practice_recurrence ?? (body.recurring === true || body.recurring === 'weekly' ? 'weekly' : body.recurring === false ? 'once' : null) ?? null,
        practiceOn: body.practiceOn ?? body.practice_on ?? body.date ?? null,
      },
      repository,
      { chatRepository },
    );
    return jsonResponse({ practice });
  } catch (error) {
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
  }
}




export async function handleListAdminAuditEventsRequest(request, env, { fetch: fetchImpl = globalThis.fetch } = {}) {
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const url = new URL(request.url);
    const repository = createAdminAuditRepository(env, { fetch: fetchImpl });
    const events = await repository.listAuditEvents({
      actorUserId: actor.id,
      limit: Number(url.searchParams.get('limit') || 50),
      actionPrefix: url.searchParams.get('prefix') || null,
    });
    return jsonResponse({ events });
  } catch (error) {
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
  }
}

export async function handleFlushAdminAuditWebhooksRequest(request, env, { fetch: fetchImpl = globalThis.fetch } = {}) {
  try {
    if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const result = await deliverAuditWebhooks(env, actor.id, { fetch: fetchImpl });
    return jsonResponse(result);
  } catch (error) {
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
  }
}

export async function handleListMyNotificationsRequest(request, env, { fetch: fetchImpl = globalThis.fetch } = {}) {
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const repository = createNotificationRepository(env, { fetch: fetchImpl });
    const notifications = await listMyNotificationsCommand({ actorUserId: actor.id }, repository);
    return jsonResponse({ notifications });
  } catch (error) {
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
  }
}

export async function handleMarkNotificationReadRequest(request, env, notificationId, { fetch: fetchImpl = globalThis.fetch } = {}) {
  try {
    if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const repository = createNotificationRepository(env, { fetch: fetchImpl });
    const result = await markNotificationReadCommand(
      { actorUserId: actor.id, notificationId },
      repository,
    );
    return jsonResponse({ notification: result });
  } catch (error) {
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
  }
}

export async function handleMarkAllNotificationsReadRequest(request, env, { fetch: fetchImpl = globalThis.fetch } = {}) {
  try {
    if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const repository = createNotificationRepository(env, { fetch: fetchImpl });
    const result = await markAllNotificationsReadCommand({ actorUserId: actor.id }, repository);
    return jsonResponse(result);
  } catch (error) {
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
  }
}

export async function handleAdminBroadcastNotificationRequest(request, env, { fetch: fetchImpl = globalThis.fetch } = {}) {
  try {
    if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const body = await readJsonBody(request);
    const repository = createNotificationRepository(env, { fetch: fetchImpl });
    const result = await adminBroadcastNotificationCommand(
      {
        actorUserId: actor.id,
        title: body.title,
        body: body.body ?? body.message,
        seasonId: body.seasonId ?? body.season_id ?? null,
        href: body.href ?? null,
      },
      repository,
    );
    try {
      const auditRepository = createAdminAuditRepository(env, { fetch: fetchImpl });
      const seasonId = body.seasonId ?? body.season_id ?? null;
      await auditRepository.writeAuditEvent({
        actorUserId: actor.id,
        action: 'admin.broadcast_notification',
        entityType: 'season',
        entityId: seasonId || '00000000-0000-4000-8000-000000000000',
        reason: String(body.title || '').slice(0, 120) || null,
        afterState: { sent: result.sent, href: body.href ?? null },
      });
      await deliverAuditWebhooks(env, actor.id, { fetch: fetchImpl });
    } catch {
      // best-effort audit
    }
    return jsonResponse(result, 201);
  } catch (error) {
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
  }
}


export async function handleTeamMatchDisputeRequest(
  request,
  env,
  teamMatchId,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const body = await readJsonBody(request);
    const note = String(body.note || body.reason || 'Dispute requested').trim().slice(0, 400);
    const notificationRepository = createNotificationRepository(env, { fetch: fetchImpl });
    // Store a packet notice for the requesting user (audit trail in their inbox).
    await notificationRepository.createUserNotification({
      recipientUserId: actor.id,
      kind: 'dispute_request',
      title: 'Dispute submitted',
      body: note || 'Match dispute submitted for admin review.',
      href: '/scorecard?match=' + encodeURIComponent(teamMatchId),
      teamMatchId,
      actorUserId: actor.id,
    });
    // Best-effort: also post matchup chat if available.
    try {
      const chatRepository = createChatRepository(env, { fetch: fetchImpl });
      if (typeof chatRepository.sendMatchupMessage === 'function') {
        await chatRepository.sendMatchupMessage({
          actorUserId: actor.id,
          teamMatchId,
          body: 'Dispute requested: ' + (note || 'Please review this match.'),
          clientMessageId: null,
        });
      }
    } catch {
      // optional
    }
    return jsonResponse({ ok: true }, 201);
  } catch (error) {
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
  }
}

export async function handleProposeTeamMatchMakeupRequest(
  request,
  env,
  teamMatchId,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const body = await readJsonBody(request);
    const repository = createTeamRepository(env, { fetch: fetchImpl });
    const makeup = await proposeTeamMatchMakeupCommand(
      {
        actorUserId: actor.id,
        teamMatchId,
        makeupOn: body.makeupOn ?? body.makeup_on ?? body.date,
        makeupLocation: body.makeupLocation ?? body.makeup_location ?? null,
        makeupNote: body.makeupNote ?? body.makeup_note ?? null,
      },
      repository,
    );
    return jsonResponse({ makeup }, 201);
  } catch (error) {
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
  }
}

export async function handleRespondTeamMatchMakeupRequest(
  request,
  env,
  teamMatchId,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const body = await readJsonBody(request);
    const repository = createTeamRepository(env, { fetch: fetchImpl });
    const makeup = await respondTeamMatchMakeupCommand(
      {
        actorUserId: actor.id,
        teamMatchId,
        response: normalizeApproveDecline(body) ?? body.response ?? body.status,
      },
      repository,
    );
    return jsonResponse({ makeup });
  } catch (error) {
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
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
        playerId: body.playerId ?? body.player_id ?? body.invitedPlayerId ?? body.invited_player_id,
      },
      repository,
    );

    return jsonResponse({ invitation }, 201);
  } catch (error) {
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
  }
}

export async function handleProposeTeamTradeRequest(
  request,
  env,
  teamId,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const body = await readJsonBody(request);
    const repository = createTeamRepository(env, { fetch: fetchImpl });
    const trade = await proposeTeamTradeCommand(
      {
        actorUserId: actor.id,
        teamId,
        offeredPlayerId: body.offeredPlayerId ?? body.offered_player_id,
        requestedTeamId: body.requestedTeamId ?? body.requested_team_id,
        requestedPlayerId: body.requestedPlayerId ?? body.requested_player_id,
      },
      repository,
    );

    return jsonResponse({ trade }, 201);
  } catch (error) {
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
  }
}

export async function handleAdminProposeTeamTradeExceptionRequest(
  request,
  env,
  teamId,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const body = await readJsonBody(request);
    const repository = createTeamRepository(env, { fetch: fetchImpl });
    const trade = await adminProposeTeamTradeExceptionCommand(
      {
        actorUserId: actor.id,
        teamId,
        offeredPlayerId: body.offeredPlayerId ?? body.offered_player_id,
        requestedTeamId: body.requestedTeamId ?? body.requested_team_id,
        requestedPlayerId: body.requestedPlayerId ?? body.requested_player_id,
      },
      repository,
    );

    return jsonResponse({ trade }, 201);
  } catch (error) {
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
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
    const response = normalizeApproveDecline(body);
    const invitation = await respondToTeamInvitationCommand(
      {
        actorUserId: actor.id,
        invitationId,
        response,
      },
      repository,
    );

    return jsonResponse({ invitation });
  } catch (error) {
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
  }
}

export async function handleRespondToTeamTradePlayerRequest(
  request,
  env,
  tradeId,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const body = await readJsonBody(request);
    const repository = createTeamRepository(env, { fetch: fetchImpl });
    const trade = await respondToTeamTradePlayerCommand(
      {
        actorUserId: actor.id,
        tradeId,
        response: normalizeApproveDecline(body) ?? body.response,
      },
      repository,
    );

    return jsonResponse({ trade });
  } catch (error) {
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
  }
}

export async function handleApproveTeamTradeCaptainRequest(
  request,
  env,
  tradeId,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const body = await readJsonBody(request);
    const repository = createTeamRepository(env, { fetch: fetchImpl });
    const trade = await approveTeamTradeCaptainCommand(
      {
        actorUserId: actor.id,
        tradeId,
        response: normalizeApproveDecline(body) ?? body.response,
      },
      repository,
    );

    return jsonResponse({ trade });
  } catch (error) {
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
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
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
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
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
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
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
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
        availabilityStatus: body.status ?? body.availabilityStatus ?? body.availability_status,
      },
      repository,
    );

    return jsonResponse({ availability });
  } catch (error) {
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
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
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
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
        availabilityStatus: body.status ?? body.availabilityStatus ?? body.availability_status,
      },
      repository,
    );

    return jsonResponse({ availability });
  } catch (error) {
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
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
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
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
        slots: body.slots ?? body.lineupSlots ?? body.lineup_slots,
      },
      repository,
    );

    // Lifecycle: team chat + in-app notice (best-effort).
    try {
      const chatRepository = createChatRepository(env, { fetch: fetchImpl });
      await chatRepository.sendTeamMessage({
        actorUserId: actor.id,
        teamId,
        body: 'Lineup locked for this matchup. Open Lineup/Scorecard when both sides are ready.',
        clientMessageId: null,
      });
    } catch {
      // ignore chat failures
    }
    try {
      const notificationRepository = createNotificationRepository(env, { fetch: fetchImpl });
      // Notify actor as confirmation; roster-wide fanout can expand later.
      await notificationRepository.createUserNotification({
        recipientUserId: actor.id,
        kind: 'lineup_locked',
        title: 'Lineup locked',
        body: 'Your team lineup is locked for this matchup.',
        href: '/lineup?team=' + encodeURIComponent(teamId) + '&round=' + encodeURIComponent(roundId),
        teamId,
        actorUserId: actor.id,
      });
    } catch {
      // ignore notification failures
    }

    return jsonResponse({ lineup });
  } catch (error) {
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
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
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
  }
}

export async function handleListPublicSeasonsRequest(
  request,
  env,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const repository = createStandingsRepository(env, { fetch: fetchImpl });
    const seasons = await repository.listPublicSeasons();
    // Public, anonymous-safe list: strong ETag + short shared edge TTL (Phase 3).
    return conditionalJsonResponse(request || new Request('https://example.test/api/seasons'), { seasons }, {
      cacheControl: 'public, max-age=15, s-maxage=30, stale-while-revalidate=60',
    });
  } catch (error) {
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
  }
}

export async function handleListSeasonScheduleRequest(
  request,
  env,
  seasonId,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const repository = createStandingsRepository(env, { fetch: fetchImpl });
    const ifNoneMatch = request?.headers?.get?.('if-none-match') || '';
    // WHY: warm polls parallelize exists+version (independent I/O) before any heavy build.
    if (ifNoneMatch) {
      const [exists, versionState] = await Promise.all([
        repository.seasonExists({ seasonId }),
        repository.getSeasonScheduleVersion({ seasonId }),
      ]);
      if (!exists) return jsonResponse({ error: "Season not found" }, 404);
      return conditionalJsonFromVersion(request, {
        scope: `schedule:${seasonId}`,
        cacheControl: 'public, max-age=10, s-maxage=20, stale-while-revalidate=40',
        getVersion: async () => versionTokenFromValue(versionState),
        buildBody: async () => ({ rounds: await repository.listSeasonSchedule({ seasonId }) }),
      });
    }
    if (!(await repository.seasonExists({ seasonId }))) {
      return jsonResponse({ error: "Season not found" }, 404);
    }
    return conditionalJsonFromVersion(request, {
      scope: `schedule:${seasonId}`,
      cacheControl: 'public, max-age=10, s-maxage=20, stale-while-revalidate=40',
      versionFromBody: async (body) => {
        // WHY: must match getSeasonScheduleVersion() shape so cold and warm ETags agree.
        const rounds = (body?.rounds || []).map((round) => ({
          id: round.roundId,
          round_number: round.roundNumber,
          scheduled_on: round.scheduledOn,
          status: round.status,
          stage: round.stage,
        }));
        const matches = [];
        for (const round of body?.rounds || []) {
          for (const m of round.matches || []) {
            matches.push({
              id: m.teamMatchId,
              round_id: round.roundId,
              status: m.status,
              table_number: m.tableNumber,
            });
          }
        }
        return versionTokenFromValue({ rounds, matches });
      },
      buildBody: async () => ({ rounds: await repository.listSeasonSchedule({ seasonId }) }),
    });
  } catch (error) {
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
  }
}

export async function handleListTeamStandingsRequest(
  request,
  env,
  seasonId,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const repository = createStandingsRepository(env, { fetch: fetchImpl });
    if (!(await repository.seasonExists({ seasonId }))) {
      return jsonResponse({ error: "Season not found" }, 404);
    }
    return conditionalJsonFromVersion(request, {
      scope: `team-standings:${seasonId}`,
      cacheControl: 'public, max-age=10, s-maxage=20, stale-while-revalidate=40',
      getVersion: async () => versionTokenFromValue(await repository.getSeasonStandingsVersion({ seasonId })),
      buildBody: async () => {
        const standings = await listTeamStandingsCommand({ seasonId }, repository);
        return { standings };
      },
    });
  } catch (error) {
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
  }
}

export async function handleListIndividualStandingsRequest(
  request,
  env,
  seasonId,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const repository = createStandingsRepository(env, { fetch: fetchImpl });
    if (!(await repository.seasonExists({ seasonId }))) {
      return jsonResponse({ error: "Season not found" }, 404);
    }
    return conditionalJsonFromVersion(request, {
      scope: `individual-standings:${seasonId}`,
      cacheControl: 'public, max-age=10, s-maxage=20, stale-while-revalidate=40',
      getVersion: async () => versionTokenFromValue(await repository.getSeasonStandingsVersion({ seasonId })),
      buildBody: async () => {
        const standings = await listIndividualStandingsCommand({ seasonId }, repository);
        return { standings };
      },
    });
  } catch (error) {
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
  }
}

export async function handleGetSeasonPrizeSummaryRequest(
  request,
  env,
  seasonId,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const repository = createPrizeRepository(env, { fetch: fetchImpl });
    const summary = await getSeasonPrizeSummaryCommand(
      { seasonId },
      repository,
    );
    return conditionalJsonResponse(request || new Request('https://example.test/api/prizes'), { summary }, {
      cacheControl: 'public, max-age=15, s-maxage=30, stale-while-revalidate=60',
    });
  } catch (error) {
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
  }
}

export async function handleConfigureSeasonPrizesRequest(
  request,
  env,
  seasonId,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const body = await readJsonBody(request);
    const repository = createPrizeRepository(env, { fetch: fetchImpl });
    const configuration = await configureSeasonPrizesCommand(
      {
        actorUserId: actor.id,
        seasonId,
        entryFeeCents: body.entryFeeCents ?? body.entry_fee_cents,
        administrationAmountCents: body.administrationAmountCents
          ?? body.administration_amount_cents,
        teamAllocationBasisPoints: body.teamAllocationBasisPoints
          ?? body.team_allocation_basis_points,
        individualAllocationBasisPoints: body.individualAllocationBasisPoints
          ?? body.individual_allocation_basis_points,
        projectedFieldSize: body.projectedFieldSize ?? body.projected_field_size,
        payoutTemplates: body.payoutTemplates ?? body.payout_templates,
      },
      repository,
    );

    return jsonResponse({ configuration }, 201);
  } catch (error) {
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
  }
}

export async function handleFinalizeSeasonPrizePayoutsRequest(
  request,
  env,
  seasonId,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const body = await readJsonBody(request);
    const repository = createPrizeRepository(env, { fetch: fetchImpl });
    const payouts = await finalizeSeasonPrizePayoutsCommand(
      {
        actorUserId: actor.id,
        seasonId,
        finalizedPayouts: body.finalizedPayouts ?? body.finalized_payouts,
      },
      repository,
    );

    return jsonResponse({ payouts }, 201);
  } catch (error) {
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
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
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
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
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
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
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
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
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
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
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const version = versionMetadata(env);
    const publishScheduleMatch = url.pathname.match(
      /^\/api\/admin\/seasons\/([^/]+)\/publish-schedule$/,
    );
    const adminSeasonsMatch = url.pathname.match(
      /^\/api\/admin\/seasons$/,
    );
    const adminSeasonSetupMatch = url.pathname.match(
      /^\/api\/admin\/seasons\/([^/]+)\/setup$/,
    );
    const adminSeasonRegistrationMatch = url.pathname.match(
      /^\/api\/admin\/seasons\/([^/]+)\/team-registration$/,
    );
    const adminSeedReturningSlotsMatch = url.pathname.match(
      /^\/api\/admin\/seasons\/([^/]+)\/team-slots\/seed$/,
    );
    const adminApplicationReviewMatch = url.pathname.match(
      /^\/api\/admin\/team-applications\/([^/]+)\/respond$/,
    );
    const adminTeamSlotManageMatch = url.pathname.match(
      /^\/api\/admin\/team-slots\/([^/]+)\/manage$/,
    );
    const adminSeasonPrizesMatch = url.pathname.match(
      /^\/api\/admin\/seasons\/([^/]+)\/prizes$/,
    );
    const adminSeasonPrizeFinalizeMatch = url.pathname.match(
      /^\/api\/admin\/seasons\/([^/]+)\/prizes\/finalize$/,
    );
    const adminTeamTradeExceptionMatch = url.pathname.match(
      /^\/api\/admin\/teams\/([^/]+)\/trades$/,
    );
    const createTeamMatch = url.pathname.match(
      /^\/api\/seasons\/([^/]+)\/teams$/,
    );
    const ownTeamRegistrationMatch = url.pathname.match(
      /^\/api\/seasons\/([^/]+)\/team-registration\/me$/,
    );
    const teamApplicationMatch = url.pathname.match(
      /^\/api\/seasons\/([^/]+)\/team-applications$/,
    );
    const teamApplicationWithdrawMatch = url.pathname.match(
      /^\/api\/team-applications\/([^/]+)\/withdraw$/,
    );
    const returningTeamSlotResponseMatch = url.pathname.match(
      /^\/api\/team-slots\/([^/]+)\/respond$/,
    );
    const teamMembershipRequestMatch = url.pathname.match(
      /^\/api\/teams\/([^/]+)\/membership-request$/,
    );
    const membershipRequestResponseMatch = url.pathname.match(
      /^\/api\/team-membership-requests\/([^/]+)\/respond$/,
    );
    const membershipRequestCancelMatch = url.pathname.match(
      /^\/api\/team-membership-requests\/([^/]+)\/cancel$/,
    );
    const teamPracticeMatch = url.pathname.match(
      /^\/api\/teams\/([^/]+)\/practice$/,
    );
    if (url.pathname === '/api/me/notifications' && request.method === 'GET') {
      return handleListMyNotificationsRequest(request, env);
    }
    if (url.pathname === '/api/me/notifications/read-all') {
      return handleMarkAllNotificationsReadRequest(request, env);
    }
    const notificationReadMatch = url.pathname.match(/^\/api\/me\/notifications\/([^/]+)\/read$/);
    if (notificationReadMatch) {
      return handleMarkNotificationReadRequest(
        request,
        env,
        decodeURIComponent(notificationReadMatch[1]),
      );
    }
    if (url.pathname === '/api/admin/audit-events' && request.method === 'GET') {
      return handleListAdminAuditEventsRequest(request, env);
    }
    if (url.pathname === '/api/admin/audit-webhooks/flush') {
      return handleFlushAdminAuditWebhooksRequest(request, env);
    }
    if (url.pathname === '/api/admin/notifications/broadcast') {
      return handleAdminBroadcastNotificationRequest(request, env);
    }
    const teamMatchDisputeMatch = url.pathname.match(
      /^\/api\/team-matches\/([^/]+)\/dispute$/,
    );
    if (teamMatchDisputeMatch) {
      return handleTeamMatchDisputeRequest(
        request,
        env,
        decodeURIComponent(teamMatchDisputeMatch[1]),
      );
    }
    const teamMatchMakeupProposeMatch = url.pathname.match(
      /^\/api\/team-matches\/([^/]+)\/makeup$/,
    );
    const teamMatchMakeupRespondMatch = url.pathname.match(
      /^\/api\/team-matches\/([^/]+)\/makeup\/respond$/,
    );
    const teamInvitationMatch = url.pathname.match(
      /^\/api\/teams\/([^/]+)\/invitations$/,
    );
    const teamTradeProposalMatch = url.pathname.match(
      /^\/api\/teams\/([^/]+)\/trades$/,
    );
    const invitationResponseMatch = url.pathname.match(
      /^\/api\/team-invitations\/([^/]+)\/respond$/,
    );
    const tradePlayerResponseMatch = url.pathname.match(
      /^\/api\/team-trades\/([^/]+)\/player-response$/,
    );
    const tradeCaptainApprovalMatch = url.pathname.match(
      /^\/api\/team-trades\/([^/]+)\/captain-approval$/,
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
    const seasonScheduleMatch = url.pathname.match(
      /^\/api\/seasons\/([^/]+)\/(?:schedule|rounds)$/,
    );
    const teamStandingsMatch = url.pathname.match(
      /^\/api\/seasons\/([^/]+)\/(?:team-standings|standings)$/,
    );
    const individualStandingsMatch = url.pathname.match(
      /^\/api\/seasons\/([^/]+)\/(?:individual-standings|player-standings)$/,
    );
    const seasonPrizesMatch = url.pathname.match(
      /^\/api\/seasons\/([^/]+)\/prizes$/,
    );
    const requireSeasonUuid = (value) => {
      // Hex-shape only (shared isUuid) so persisted non-RFC seed season ids remain readable.
      if (!isUuid(String(value || "").trim())) {
        return jsonResponse({ error: "That season or match link is invalid." }, 400);
      }
      return null;
    };
    // Validate season UUID only for allowed methods; non-GET should 405 first.
    if (request.method === "GET" || request.method === "HEAD") {
      for (const m of [seasonScheduleMatch, teamStandingsMatch, individualStandingsMatch, seasonPrizesMatch]) {
        if (m) {
          const bad = requireSeasonUuid(m[1]);
          if (bad) return bad;
        }
      }
    }

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

    if (url.pathname === "/health/environment") {
      const readiness = environmentReadiness(env, { host: url.hostname || request.headers.get('host') });
      const failedChecks = (readiness.checks || []).filter((item) => !item.ok).map((item) => item.name);
      return jsonResponse(
        {
          service: serviceName,
          version: version.id,
          versionTag: version.tag,
          deployedAt: version.timestamp,
          ok: readiness.ok,
          environment: readiness.environment,
          host: readiness.host,
          expectedHostEnvironment: readiness.expectedHostEnvironment,
          hostMatchesEnvironment: readiness.hostMatchesEnvironment,
          expectedSupabaseSchema: readiness.expectedSupabaseSchema,
          expectedPrivateSupabaseSchema: readiness.expectedPrivateSupabaseSchema,
          checks: readiness.checks || [],
          failedChecks,
          noAuthTeamTest: {
            note: 'JFL/DRU only: unauthenticated /api/me/* uses BETA_AUTH_BYPASS + BETA_ACTOR_USER_ID',
            requires: ['ENVIRONMENT=jfl|dru', 'BETA_AUTH_BYPASS=1', 'BETA_ACTOR_USER_ID', 'SUPABASE_SCHEMA=lane'],
          },
        },
        readiness.ok ? 200 : 503,
      );
    }

    if (url.pathname === "/health/features") {
      // Lightweight schema probes for operator/agent readiness (no secrets returned).
      const features = {
        teamPractice: { ready: false, detail: 'not_checked' },
      };
      try {
        const supabaseUrl = String(env.SUPABASE_URL || '').replace(/\/+$/, '');
        const key = env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !key) {
          features.teamPractice = { ready: false, detail: 'missing_supabase_env' };
        } else {
          const schema = String(env.SUPABASE_SCHEMA || 'public').trim() || 'public';
          const response = await fetch(
            `${supabaseUrl}/rest/v1/teams?select=id,practice_location,practice_schedule,practice_recurrence,practice_on&limit=1`,
            {
              method: 'GET',
              headers: {
                apikey: key,
                authorization: `Bearer ${key}`,
                accept: 'application/json',
                'accept-profile': schema,
                'content-profile': schema,
              },
            },
          );
          const text = await response.text();
          if (response.ok) {
            features.teamPractice = { ready: true, detail: 'ok' };
          } else if (/practice_location|42703|PGRST/i.test(text)) {
            features.teamPractice = { ready: false, detail: 'migration_pending' };
          } else {
            features.teamPractice = { ready: false, detail: `http_${response.status}` };
          }
        }
      } catch {
        features.teamPractice = { ready: false, detail: 'probe_failed' };
      }
      const allReady = Object.values(features).every((f) => f && f.ready);
      return Response.json(
        {
          ok: true,
          service: serviceName,
          version: version.id,
          deployedAt: version.timestamp,
          features,
          allReady,
        },
        { status: 200, headers: { 'cache-control': 'no-store' } },
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


    if (url.pathname === "/players") {
      if (request.method !== "GET") {
        return jsonResponse({ error: "Method not allowed" }, 405);
      }

      return new Response(renderPlayersDirectoryPage(), {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
        },
      });
    }

if (url.pathname === "/standings") {
      if (request.method !== "GET") {
        return jsonResponse({ error: "Method not allowed" }, 405);
      }

      return new Response(renderStandingsPage(), {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
        },
      });
    }

    if (url.pathname === "/prizes") {
      if (request.method !== "GET") {
        return jsonResponse({ error: "Method not allowed" }, 405);
      }

      try {
        const html = renderPrizesPage();
        return new Response(html, {
          headers: {
            "content-type": "text/html; charset=utf-8",
            "cache-control": "no-store",
          },
        });
      } catch (error) {
        return new Response(
          `<!doctype html><html lang="en"><body><h1>Prizes unavailable</h1><p>${String(error?.message || error)}</p><p><a href="/">Home</a></p></body></html>`,
          {
            status: 500,
            headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
          },
        );
      }
    }

    if (url.pathname === "/season-setup") {
      if (request.method !== "GET") {
        return jsonResponse({ error: "Method not allowed" }, 405);
      }

      return new Response(renderSeasonSetupPage(), {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
        },
      });
    }

    if (url.pathname === "/lineup") {
      if (request.method !== "GET") {
        return jsonResponse({ error: "Method not allowed" }, 405);
      }

      return new Response(renderLineupPage(), {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
        },
      });
    }

    if (url.pathname === "/profile") {
      if (request.method !== "GET") {
        return jsonResponse({ error: "Method not allowed" }, 405);
      }

      return new Response(renderProfilePage(env), {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
        },
      });
    }

    if (url.pathname === "/availability") {
      if (request.method !== "GET") {
        return jsonResponse({ error: "Method not allowed" }, 405);
      }

      return new Response(renderAvailabilityPage(), {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
        },
      });
    }

    if (url.pathname === "/teams") {
      if (request.method !== "GET") {
        return jsonResponse({ error: "Method not allowed" }, 405);
      }

      return new Response(renderTeamsPage(), {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
        },
      });
    }

    if (url.pathname === "/trades") {
      if (request.method !== "GET") {
        return jsonResponse({ error: "Method not allowed" }, 405);
      }

      return new Response(renderTradesPage(), {
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

    if (adminSeasonsMatch) {
      if (request.method === "GET") {
        return handleListAdminSeasonsRequest(request, env);
      }
      if (request.method === "POST") {
        return handleCreateSeasonSetupRequest(request, env);
      }

      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    if (adminSeasonSetupMatch) {
      if (request.method === "GET") {
        return handleGetSeasonSetupRequest(
          request,
          env,
          decodeURIComponent(adminSeasonSetupMatch[1]),
        );
      }
      if (request.method === "PUT") {
        return handleUpdateSeasonSetupRequest(
          request,
          env,
          decodeURIComponent(adminSeasonSetupMatch[1]),
        );
      }

      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    if (adminSeasonRegistrationMatch) {
      if (request.method === "GET") {
        return handleGetAdminSeasonRegistrationRequest(
          request,
          env,
          decodeURIComponent(adminSeasonRegistrationMatch[1]),
        );
      }
      if (request.method === "PUT") {
        return handleConfigureSeasonRegistrationRequest(
          request,
          env,
          decodeURIComponent(adminSeasonRegistrationMatch[1]),
        );
      }
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    if (adminSeedReturningSlotsMatch) {
      if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);
      return handleSeedReturningTeamSlotsRequest(
        request,
        env,
        decodeURIComponent(adminSeedReturningSlotsMatch[1]),
      );
    }

    if (adminApplicationReviewMatch) {
      if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);
      return handleReviewTeamApplicationRequest(
        request,
        env,
        decodeURIComponent(adminApplicationReviewMatch[1]),
      );
    }

    if (adminTeamSlotManageMatch) {
      if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);
      return handleManageTeamSlotRequest(
        request,
        env,
        decodeURIComponent(adminTeamSlotManageMatch[1]),
      );
    }

    if (adminSeasonPrizesMatch) {
      if (request.method !== "POST") {
        return jsonResponse({ error: "Method not allowed" }, 405);
      }

      return handleConfigureSeasonPrizesRequest(
        request,
        env,
        decodeURIComponent(adminSeasonPrizesMatch[1]),
      );
    }

    if (adminSeasonPrizeFinalizeMatch) {
      if (request.method !== "POST") {
        return jsonResponse({ error: "Method not allowed" }, 405);
      }

      return handleFinalizeSeasonPrizePayoutsRequest(
        request,
        env,
        decodeURIComponent(adminSeasonPrizeFinalizeMatch[1]),
      );
    }

    if (adminTeamTradeExceptionMatch) {
      if (request.method !== "POST") {
        return jsonResponse({ error: "Method not allowed" }, 405);
      }

      return handleAdminProposeTeamTradeExceptionRequest(
        request,
        env,
        decodeURIComponent(adminTeamTradeExceptionMatch[1]),
      );
    }

    if (url.pathname === "/api/me/profile/standing-availability") {
      if (request.method === "PUT") {
        return handleSaveOwnStandingAvailabilityRequest(request, env);
      }
      return jsonResponse({ error: "Method not allowed" }, 405);
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

    if (url.pathname === "/api/me/teams") {
      if (request.method !== "GET") {
        return jsonResponse({ error: "Method not allowed" }, 405);
      }

      return handleListOwnTeamManagementRequest(request, env);
    }

    if (url.pathname === "/api/me/team-membership-requests") {
      if (request.method !== "GET") return jsonResponse({ error: "Method not allowed" }, 405);
      return handleListOwnTeamMembershipRequestsRequest(request, env);
    }

    const tradeCounterpartiesMatch = url.pathname.match(
      /^\/api\/seasons\/([^/]+)\/trade-counterparties$/,
    );
    if (tradeCounterpartiesMatch) {
      if (request.method !== "GET") {
        return jsonResponse({ error: "Method not allowed" }, 405);
      }
      return handleListTradeCounterpartyOptionsRequest(
        request,
        env,
        decodeURIComponent(tradeCounterpartiesMatch[1]),
      );
    }

    if (url.pathname === "/api/me/trades") {
      if (request.method !== "GET") {
        return jsonResponse({ error: "Method not allowed" }, 405);
      }

      return handleListOwnTeamTradesRequest(request, env);
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

    if (ownTeamRegistrationMatch) {
      if (request.method !== "GET") return jsonResponse({ error: "Method not allowed" }, 405);
      return handleGetOwnTeamRegistrationRequest(
        request,
        env,
        decodeURIComponent(ownTeamRegistrationMatch[1]),
      );
    }

    if (teamApplicationMatch) {
      if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);
      return handleCreateTeamRequest(
        request,
        env,
        decodeURIComponent(teamApplicationMatch[1]),
      );
    }

    if (teamApplicationWithdrawMatch) {
      if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);
      return handleWithdrawTeamApplicationRequest(
        request,
        env,
        decodeURIComponent(teamApplicationWithdrawMatch[1]),
      );
    }

    if (returningTeamSlotResponseMatch) {
      if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);
      return handleRespondToReturningTeamSlotRequest(
        request,
        env,
        decodeURIComponent(returningTeamSlotResponseMatch[1]),
      );
    }

    if (teamMembershipRequestMatch) {
      if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);
      return handleRequestTeamMembershipRequest(
        request,
        env,
        decodeURIComponent(teamMembershipRequestMatch[1]),
      );
    }

    if (membershipRequestResponseMatch) {
      if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);
      return handleRespondToTeamMembershipRequest(
        request,
        env,
        decodeURIComponent(membershipRequestResponseMatch[1]),
      );
    }

    if (membershipRequestCancelMatch) {
      if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);
      return handleCancelTeamMembershipRequest(
        request,
        env,
        decodeURIComponent(membershipRequestCancelMatch[1]),
      );
    }

    if (teamPracticeMatch) {
      if (request.method !== "PUT" && request.method !== "POST") {
        return jsonResponse({ error: "Method not allowed" }, 405);
      }

      return handleUpdateTeamPracticeRequest(
        request,
        env,
        decodeURIComponent(teamPracticeMatch[1]),
      );
    }

    if (teamMatchMakeupProposeMatch) {
      return handleProposeTeamMatchMakeupRequest(
        request,
        env,
        decodeURIComponent(teamMatchMakeupProposeMatch[1]),
      );
    }

    if (teamMatchMakeupRespondMatch) {
      return handleRespondTeamMatchMakeupRequest(
        request,
        env,
        decodeURIComponent(teamMatchMakeupRespondMatch[1]),
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

    if (teamTradeProposalMatch) {
      if (request.method !== "POST") {
        return jsonResponse({ error: "Method not allowed" }, 405);
      }

      return handleProposeTeamTradeRequest(
        request,
        env,
        decodeURIComponent(teamTradeProposalMatch[1]),
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

    if (tradePlayerResponseMatch) {
      if (request.method !== "POST") {
        return jsonResponse({ error: "Method not allowed" }, 405);
      }

      return handleRespondToTeamTradePlayerRequest(
        request,
        env,
        decodeURIComponent(tradePlayerResponseMatch[1]),
      );
    }

    if (tradeCaptainApprovalMatch) {
      if (request.method !== "POST") {
        return jsonResponse({ error: "Method not allowed" }, 405);
      }

      return handleApproveTeamTradeCaptainRequest(
        request,
        env,
        decodeURIComponent(tradeCaptainApprovalMatch[1]),
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

    if (url.pathname === "/api/seasons") {
      if (request.method === "HEAD") {
        return new Response(null, { status: 200, headers: { "cache-control": "no-store", "content-type": "application/json" } });
      }
      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: { allow: "GET, HEAD, OPTIONS", "cache-control": "no-store" } });
      }
      if (request.method !== "GET") {
        return jsonResponse({ error: "Method not allowed" }, 405);
      }

      return handleListPublicSeasonsRequest(request, env);
    }

    if (seasonScheduleMatch) {
      if (request.method !== "GET") {
        return jsonResponse({ error: "Method not allowed" }, 405);
      }

      return handleListSeasonScheduleRequest(
        request,
        env,
        decodeURIComponent(seasonScheduleMatch[1]),
      );
    }

    if (teamStandingsMatch) {
      if (request.method !== "GET") {
        return jsonResponse({ error: "Method not allowed" }, 405);
      }

      return handleListTeamStandingsRequest(
        request,
        env,
        decodeURIComponent(teamStandingsMatch[1]),
      );
    }

    if (individualStandingsMatch) {
      if (request.method !== "GET") {
        return jsonResponse({ error: "Method not allowed" }, 405);
      }

      return handleListIndividualStandingsRequest(
        request,
        env,
        decodeURIComponent(individualStandingsMatch[1]),
      );
    }

    if (seasonPrizesMatch) {
      if (request.method !== "GET") {
        return jsonResponse({ error: "Method not allowed" }, 405);
      }

      return handleGetSeasonPrizeSummaryRequest(
        request,
        env,
        decodeURIComponent(seasonPrizesMatch[1]),
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

