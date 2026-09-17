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
import { renderStandingsPage } from './standingsPage.js';
import { createStandingsRepository } from './standingsRepository.js';
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
        slots: body.slots ?? body.lineupSlots,
      },
      repository,
    );

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
  env,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const repository = createStandingsRepository(env, { fetch: fetchImpl });
    const seasons = await repository.listPublicSeasons();
    return jsonResponse({ seasons });
  } catch (error) {
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
  }
}

export async function handleListSeasonScheduleRequest(
  env,
  seasonId,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const repository = createStandingsRepository(env, { fetch: fetchImpl });
    const seasons = await repository.listPublicSeasons();
    if (!seasons.some((season) => season.id === seasonId)) {
      return jsonResponse({ error: "Season not found" }, 404);
    }
    const rounds = await repository.listSeasonSchedule({ seasonId });
    return jsonResponse({ rounds });
  } catch (error) {
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
  }
}

export async function handleListTeamStandingsRequest(
  env,
  seasonId,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const repository = createStandingsRepository(env, { fetch: fetchImpl });
    const seasons = await repository.listPublicSeasons();
    if (!seasons.some((season) => season.id === seasonId)) {
      return jsonResponse({ error: "Season not found" }, 404);
    }
    const standings = await listTeamStandingsCommand(
      { seasonId },
      repository,
    );

    return jsonResponse({ standings });
  } catch (error) {
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
  }
}

export async function handleListIndividualStandingsRequest(
  env,
  seasonId,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const repository = createStandingsRepository(env, { fetch: fetchImpl });
    const seasons = await repository.listPublicSeasons();
    if (!seasons.some((season) => season.id === seasonId)) {
      return jsonResponse({ error: "Season not found" }, 404);
    }
    const standings = await listIndividualStandingsCommand(
      { seasonId },
      repository,
    );

    return jsonResponse({ standings });
  } catch (error) {
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
  }
}

export async function handleGetSeasonPrizeSummaryRequest(
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

    return jsonResponse({ summary });
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

