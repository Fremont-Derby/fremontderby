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
        action: body.action,
        reason: body.reason,
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
    if (!['approved', 'declined'].includes(body.response)) {
      throw new Error('response must be approved or declined');
    }
    const repository = createTeamMembershipRequestRepository(env, { fetch: fetchImpl });
    const membershipRequest = await repository.respond({
      actorUserId: actor.id,
      requestId,
      response: body.response,
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
    const teamManagement = await listOwnTeamManagementCommand(
      { actorUserId: actor.id },
      repository,
    );

    return jsonResponse({ teamManagement });
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
        playerId: body.playerId ?? body.invitedPlayerId,
      },
      repository,
    );

    return jsonResponse({ invitation }, 201);
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
        availabilityStatus: body.status ?? body.availabilityStatus,
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
        availabilityStatus: body.status ?? body.availabilityStatus,
      },
      repository,
    );

    return jsonResponse({ availability });
  } catch (error) {
    return jsonResponse({ error: clientErrorMessage(error) }, statusForError(error));
  }
}

