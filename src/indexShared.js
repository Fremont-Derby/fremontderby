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

export const serviceName = "fremontderby";

export function versionMetadata(env = {}) {
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

export function jsonResponse(body, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store",
    },
  });
}

export async function readJsonBody(request) {
  try {
    const text = await request.text();
    if (!text.trim()) {
      return {};
    }

    const body = JSON.parse(text);
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

export function clientErrorMessage(error) {
  const msg = String(error?.message || "Request failed");
  if (/invalid input syntax for type uuid/i.test(msg)) {
    return "That season or match link is invalid.";
  }
  if (/Supabase request failed with 400:.*uuid/i.test(msg)) {
    return "That season or match link is invalid.";
  }
  return msg;
}
export function statusForError(error) {
  if (error instanceof AuthError) return error.status;
  if (/invalid input syntax for type uuid/i.test(String(error?.message || ""))) return 400;
  if (error.message === "Season not found") return 404;
  if (error.message === "Actor is not a league admin") return 403;
  if (error.message.includes("Actor is not a league admin")) return 403;
  if (error.message.includes("Only the active captain")) return 403;
  if (error.message.includes("Only an active captain")) return 403;
  if (error.message.includes("Only a traded player")) return 403;
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
  if (error.message.includes("prize payouts are already finalized")) return 409;
  if (error.message.includes("Season setup can only change before publication")) return 409;
  if (error.message.includes("Roster lock has passed")) return 409;
  if (error.message.includes("pending trade already includes")) return 409;
  if (error.message.includes("Trade is no longer pending")) return 409;
  if (error.message.includes("active membership changed")) return 409;
  if (error.message.includes("active non-captain roster member")) return 409;
  if (error.message === "Player match not found") return 404;
  return 400;
}

