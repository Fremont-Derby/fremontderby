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
import { AuthError, authenticateSupabaseUser } from './supabaseAuth.js';
import { createSupabaseSeasonRepository } from './supabaseSeasonRepository.js';
import {
  cancelTeamInvitationCommand,
  invitePlayerToTeamCommand,
  listOwnTeamManagementCommand,
  removeTeamMemberCommand,
  respondToTeamInvitationCommand,
} from './teamCommands.js';
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

import {
  serviceName,
  versionMetadata,
  jsonResponse,
  readJsonBody,
  clientErrorMessage,
  statusForError,
  renderLandingPage,
} from './indexShared.js';

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
    const profile = await saveOwnPlayerProfileCommand(
      {
        actorUserId: actor.id,
        displayName: body.displayName,
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
        teamName: body.teamName ?? body.name,
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
        action: body.action,
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
        decision: body.decision,
        reason: body.reason,
      },
      repository,
    );
    return jsonResponse({ application });
  } catch (error) {
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
  }
}

