/**
 * Shared RPC → HTTP status mapping (data-driven; #951 / #949).
 * Prefer stable product codes when present (`ERR_*` / `error.code`).
 * Otherwise match phrase rules in order. Default 400.
 */

export function rpcErrorText(error) {
  return String(error?.message || 'Request failed');
}

/** @type {Record<string, number>} */
export const RPC_ERROR_CODES = {
  ERR_FORBIDDEN: 403,
  ERR_NOT_FOUND: 404,
  ERR_CONFLICT: 409,
  ERR_BAD_REQUEST: 400,
  ERR_UNAUTHORIZED: 401,
};

/**
 * Phrase rules: first match wins within this ordered list.
 * @type {{ status: number, re: RegExp }[]}
 */
export const RPC_ERROR_PHRASE_RULES = [
  { status: 401, re: /Supabase request failed with 401|\bHTTP 401\b/i },
  { status: 403, re: /Supabase request failed with 403/i },
  { status: 400, re: /invalid input syntax for type uuid/i },
  { status: 400, re: /Player name is required|Name exceeds \d+ characters/i },
  { status: 400, re: /phone must be valid|reason required/i },

  { status: 403, re: /Actor is not a league admin/i },
  { status: 403, re: /League admin access/i },
  { status: 403, re: /Only (?:the |an )?active captain/i },
  { status: 403, re: /Only a traded player/i },
  { status: 403, re: /Only the requesting player/i },
  { status: 403, re: /Only the invited player/i },
  { status: 403, re: /Only match players or active team captains/i },
  { status: 403, re: /Active roster membership is required/i },
  { status: 403, re: /not an active member of the scoring team/i },
  { status: 403, re: /active on both teams in the matchup/i },
  { status: 403, re: /Scoring team is not part/i },
  { status: 403, re: /membership is required|No team chat access/i },
  { status: 403, re: /Direct messages are blocked|Both players must participate/i },
  { status: 403, re: /League chat access|Active season participation/i },
  { status: 403, re: /Matchup chat access|matchup team membership|Completed matchup chats/i },

  { status: 404, re: /Season not found/i },
  { status: 404, re: /Player match not found/i },
  { status: 404, re: /Team not found/i },
  { status: 404, re: /Player not found|Invited player not found/i },
  { status: 404, re: /Direct conversation not found|Chat message not found|Chat report not found/i },
  { status: 404, re: /Team matchup not found/i },
  { status: 404, re: /Invitation not found|Membership request not found|(?:request|Report) not found/i },
  { status: 404, re: /Returning team slot not found/i },
  { status: 404, re: /Active team membership not found/i },
  { status: 409, re: /Player is already scheduled/i },
  { status: 409, re: /already complete/i },
  { status: 409, re: /is finalized/i },
  { status: 409, re: /no racks to undo/i },
  { status: 409, re: /before finalization/i },
  { status: 409, re: /before correction/i },
  { status: 409, re: /valid completed race state/i },
  { status: 409, re: /valid corrected race state/i },
  { status: 409, re: /rack history must match/i },
  { status: 409, re: /Race targets are required/i },
  { status: 409, re: /Race target/i },
  { status: 409, re: /Score record/i },
  { status: 409, re: /Resolved rack history/i },
  { status: 409, re: /Opening discipline is locked/i },
  { status: 409, re: /Rack is not present/i },
  { status: 409, re: /Score changed on another device/i },
  { status: 409, re: /Refresh the scorecard before changing the score/i },
  { status: 409, re: /Both teams must confirm/i },
  { status: 409, re: /Both team score records are required/i },
  { status: 409, re: /prize payouts are already finalized/i },
  { status: 409, re: /Season setup can only change before publication/i },
  { status: 409, re: /Roster lock has passed/i },
  { status: 409, re: /Availability date is not a scheduled league date/i },
  { status: 409, re: /Active season registration is required to set availability/i },
  { status: 409, re: /pending trade already includes/i },
  { status: 409, re: /Trade is no longer pending/i },
  { status: 409, re: /active membership changed/i },
  { status: 409, re: /active non-captain roster member/i },
  { status: 409, re: /Player already has an active team membership/i },
  { status: 409, re: /already an active member of this team/i },
  { status: 409, re: /You already captain a team in this season/i },
  { status: 409, re: /Assigned captain already captains a team in this season/i },
  { status: 409, re: /Transfer player already captains a team in this season/i },
  { status: 409, re: /already captains another team/i },
  { status: 409, re: /already has an active captain/i },
  { status: 409, re: /(?:You )?already have a team application/i },
  { status: 409, re: /Season is not open for team applications/i },
  { status: 409, re: /Cannot regenerate player matches after scoring/i },
  { status: 409, re: /Cannot regenerate player matches after racks have been recorded/i },
  { status: 409, re: /Season registration is not open/i },
  { status: 409, re: /That team name is already reserved/i },
  { status: 409, re: /That team name is already used in this season/i },
  { status: 409, re: /Trade blocked: player still has an active team membership/i },
  { status: 409, re: /already pending/i },
  { status: 409, re: /no longer pending/i },
  { status: 409, re: /Membership request is already pending/i },
  { status: 409, re: /Invitation is no longer pending/i },
  { status: 409, re: /Membership request is no longer pending/i },
  { status: 409, re: /Returning team slot is no longer awaiting a response/i },
  { status: 409, re: /Player profile is required/i },
  { status: 409, re: /Teams can only be added before season publication/i },
  { status: 409, re: /No team slots are currently available|No team slots remaining/i },
  { status: 409, re: /Active team membership is required/i },
  { status: 409, re: /Rostered players cannot register as free agents/i },
  { status: 409, re: /Active season registration is required/i },
  { status: 409, re: /not a scheduled league date/i },
  { status: 409, re: /Active captains must keep/i },
  { status: 409, re: /before closing/i },
  { status: 409, re: /still need/i },
  { status: 409, re: /last league admin/i },
  { status: 409, re: /captain lifecycle/i },
  { status: 409, re: /Phone number is required/i },
  { status: 409, re: /must be qualified before it can take a season slot/i },
  { status: 409, re: /already exists/i },
  { status: 409, re: /regular season/i },
  { status: 409, re: /Postseason/i },
  { status: 409, re: /semifinal|championship/i },
  { status: 409, re: /team_applications_active_captain_unique/i },
  { status: 409, re: /team_applications_active_name_unique/i },
  { status: 409, re: /one_active_team_membership_per_player_season/i },
  { status: 409, re: /one_active_captain_team_per_season/i },
  { status: 409, re: /teams_season_id_name_key/i },
  { status: 409, re: /direct_conversations_season_id_player_low_id_player_high_id_key/i },
  { status: 409, re: /conversation with this player already exists/i },
];

/**
 * @param {unknown} error
 * @param {{ authStatus?: number, fallback?: number }} [options]
 * @returns {number}
 */
export function rpcErrorStatus(error, options = {}) {
  if (options.authStatus != null) return options.authStatus;
  if (Number(error?.status) >= 400 && Number(error.status) < 600) return Number(error.status);

  const code = error?.code || error?.error_code || error?.details?.code;
  if (typeof code === 'string' && RPC_ERROR_CODES[code]) {
    return RPC_ERROR_CODES[code];
  }

  const message = rpcErrorText(error);
  const codeInMessage = message.match(/\b(ERR_[A-Z0-9_]+)\b/);
  if (codeInMessage && RPC_ERROR_CODES[codeInMessage[1]]) {
    return RPC_ERROR_CODES[codeInMessage[1]];
  }

  for (const rule of RPC_ERROR_PHRASE_RULES) {
    if (rule.re.test(message)) return rule.status;
  }
  return options.fallback ?? 400;
}
