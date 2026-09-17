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

import {
  handleWithdrawTeamApplicationRequest,
  handleRespondToReturningTeamSlotRequest,
} from './indexHandlersA.js';
import {
  handleRequestTeamMembershipRequest,
  handleRespondToTeamMembershipRequest,
  handleCancelTeamMembershipRequest,
  handleInvitePlayerToTeamRequest,
  handleRespondToTeamInvitationRequest,
  handleCancelTeamInvitationRequest,
  handleRemoveTeamMemberRequest,
  handleRegisterFreeAgentRequest,
  handleSetFreeAgentAvailabilityRequest,
  handleListEligibleFreeAgentsRequest,
  handleSetRosterAvailabilityRequest,
} from './indexHandlersB.js';
import {
  handleListTeamRoundAvailabilityRequest,
  handleSubmitTeamLineupRequest,
  handleListVisibleTeamLineupsRequest,
  handleListPublicSeasonsRequest,
  handleListSeasonScheduleRequest,
  handleListTeamStandingsRequest,
  handleListIndividualStandingsRequest,
  handleGetSeasonPrizeSummaryRequest,
  handleGetPlayerMatchScorecardRequest,
  handleRecordPlayerMatchRackRequest,
  handleUndoPlayerMatchRackRequest,
  handleFinalizePlayerMatchRequest,
  handleCorrectPlayerMatchRequest,
} from './indexHandlersC.js';
import { buildRouteContext } from './indexRouteContext.js';

export async function routeRequestPartB(request, env) {
  const {
    url,
    teamApplicationWithdrawMatch,
    returningTeamSlotResponseMatch,
    teamMembershipRequestMatch,
    membershipRequestResponseMatch,
    membershipRequestCancelMatch,
    teamInvitationMatch,
    invitationResponseMatch,
    invitationCancelMatch,
    teamMemberRemoveMatch,
    registerFreeAgentMatch,
    freeAgentAvailabilityMatch,
    rosterAvailabilityMatch,
    eligibleFreeAgentsMatch,
    teamRoundAvailabilityMatch,
    teamLineupMatch,
    seasonScheduleMatch,
    teamStandingsMatch,
    individualStandingsMatch,
    seasonPrizesMatch,
    playerMatchScorecardMatch,
    playerMatchRackMatch,
    playerMatchRackUndoMatch,
    playerMatchFinalizeMatch,
    playerMatchCorrectMatch,
  } = buildRouteContext(request, env);
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

      return handleListPublicSeasonsRequest(env);
    }

    if (seasonScheduleMatch) {
      if (request.method !== "GET") {
        return jsonResponse({ error: "Method not allowed" }, 405);
      }

      return handleListSeasonScheduleRequest(
        env,
        decodeURIComponent(seasonScheduleMatch[1]),
      );
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

    if (seasonPrizesMatch) {
      if (request.method !== "GET") {
        return jsonResponse({ error: "Method not allowed" }, 405);
      }

      return handleGetSeasonPrizeSummaryRequest(
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
    });}
