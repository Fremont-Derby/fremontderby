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
  handlePublishScheduleRequest,
  handleCreateSeasonSetupRequest,
  handleListAdminSeasonsRequest,
  handleGetSeasonSetupRequest,
  handleUpdateSeasonSetupRequest,
  handleGetOwnProfileRequest,
  handleSaveOwnProfileRequest,
  handleCreateTeamRequest,
  handleGetOwnTeamRegistrationRequest,
  handleGetAdminSeasonRegistrationRequest,
  handleConfigureSeasonRegistrationRequest,
  handleReviewTeamApplicationRequest,
} from './indexHandlersA.js';
import {
  handleManageTeamSlotRequest,
  handleSeedReturningTeamSlotsRequest,
  handleListOwnTeamMembershipRequestsRequest,
  handleListOwnTeamManagementRequest,
} from './indexHandlersB.js';
import {
  handleConfigureSeasonPrizesRequest,
  handleFinalizeSeasonPrizePayoutsRequest,
} from './indexHandlersC.js';
import { buildRouteContext } from './indexRouteContext.js';

export async function routeRequestPartA(request, env) {
  const {
    url,
    version,
    publishScheduleMatch,
    adminSeasonsMatch,
    adminSeasonSetupMatch,
    adminSeasonRegistrationMatch,
    adminSeedReturningSlotsMatch,
    adminApplicationReviewMatch,
    adminTeamSlotManageMatch,
    adminSeasonPrizesMatch,
    adminSeasonPrizeFinalizeMatch,
    createTeamMatch,
    ownTeamRegistrationMatch,
    teamApplicationMatch,
    seasonScheduleMatch,
    teamStandingsMatch,
    individualStandingsMatch,
    seasonPrizesMatch,
  } = buildRouteContext(request, env);
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const requireSeasonUuid = (value) => {
    if (!UUID_RE.test(String(value || ""))) {
      return jsonResponse({ error: "That season or match link is invalid." }, 400);
    }
    return null;
  };
    if (request.method === "GET" || request.method === "HEAD") {
      for (const m of [seasonScheduleMatch, teamStandingsMatch, individualStandingsMatch, seasonPrizesMatch]) {
        if (m) {
          const bad = requireSeasonUuid(m[1]);
          if (bad) return bad;
        }
      }
    }
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
      const readiness = environmentReadiness(env);
      return jsonResponse(
        {
          service: serviceName,
          version: version.id,
          versionTag: version.tag,
          deployedAt: version.timestamp,
          ok: readiness.ok,
          environment: readiness.environment,
        },
        readiness.ok ? 200 : 503,
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

      return new Response(renderPrizesPage(), {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
        },
      });
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

  return null;
}
