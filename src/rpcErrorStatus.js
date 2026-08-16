/**
 * Shared RPC → HTTP status mapping.
 * Repositories wrap PostgREST failures as:
 *   `Supabase request failed with ${status}: ${productOrInfraMessage}`
 * Product rules must match on substrings so the wrapper never blocks 409/403.
 * Do not trust PostgREST's status for business conflicts (almost always 400).
 */

export function rpcErrorText(error) {
  return String(error?.message || 'Request failed');
}

/**
 * @param {unknown} error
 * @param {{ authStatus?: number }} [options]
 * @returns {number}
 */
export function rpcErrorStatus(error, options = {}) {
  if (options.authStatus != null) return options.authStatus;
  if (Number(error?.status) >= 400 && Number(error.status) < 600) return Number(error.status);

  const message = rpcErrorText(error);

  if (/Supabase request failed with 401/i.test(message)) return 401;
  if (/Supabase request failed with 403/i.test(message)) return 403;
  if (/invalid input syntax for type uuid/i.test(message)) return 400;

  if (
    /Actor is not a league admin/i.test(message)
    || /League admin access/i.test(message)
    || /Only the active captain/i.test(message)
    || /Only an active captain/i.test(message)
    || /Only a traded player/i.test(message)
    || /Only the requesting player/i.test(message)
    || /Only the invited player/i.test(message)
    || /Only match players or active team captains/i.test(message)
    || /Active roster membership is required/i.test(message)
    || /not an active member of the scoring team/i.test(message)
    || /active on both teams in the matchup/i.test(message)
    || /Scoring team is not part/i.test(message)
    || /membership is required|No team chat access/i.test(message)
    || /Direct messages are blocked|Both players must participate/i.test(message)
    || /League chat access|Active season participation/i.test(message)
    || /Matchup chat access|matchup team membership|Completed matchup chats/i.test(message)
  ) {
    return 403;
  }

  if (
    /Season not found/i.test(message)
    || /Player match not found/i.test(message)
    || /Team not found/i.test(message)
    || /Player not found|Invited player not found/i.test(message)
    || /Direct conversation not found|Chat message not found|Chat report not found/i.test(message)
    || /Team matchup not found/i.test(message)
    || /Invitation not found|Membership request not found/i.test(message)
    || /Returning team slot not found/i.test(message)
    || /Active team membership not found/i.test(message)
  ) {
    return 404;
  }

  if (
    /Player is already scheduled/i.test(message)
    || /already complete/i.test(message)
    || /is finalized/i.test(message)
    || /no racks to undo/i.test(message)
    || /before finalization/i.test(message)
    || /before correction/i.test(message)
    || /valid completed race state/i.test(message)
    || /valid corrected race state/i.test(message)
    || /rack history must match/i.test(message)
    || /Race targets are required/i.test(message)
    || /Race target/i.test(message)
    || /Score record/i.test(message)
    || /Resolved rack history/i.test(message)
    || /Opening discipline is locked/i.test(message)
    || /Rack is not present/i.test(message)
    || /Score changed on another device/i.test(message)
    || /Refresh the scorecard before changing the score/i.test(message)
    || /Both teams must confirm/i.test(message)
    || /Both team score records are required/i.test(message)
    || /prize payouts are already finalized/i.test(message)
    || /Season setup can only change before publication/i.test(message)
    || /Roster lock has passed/i.test(message)
    || /Availability date is not a scheduled league date/i.test(message)
    || /Active season registration is required to set availability/i.test(message)
    || /pending trade already includes/i.test(message)
    || /Trade is no longer pending/i.test(message)
    || /active membership changed/i.test(message)
    || /active non-captain roster member/i.test(message)
    || /Player already has an active team membership/i.test(message)
    || /already an active member of this team/i.test(message)
    || /You already captain a team in this season/i.test(message)
    || /Assigned captain already captains a team in this season/i.test(message)
    || /Transfer player already captains a team in this season/i.test(message)
    || /already captains another team/i.test(message)
    || /already has an active captain/i.test(message)
    || /already have a team application in this season/i.test(message)
    || /Season is not open for team applications/i.test(message)
    || /Season registration is not open/i.test(message)
    || /That team name is already reserved/i.test(message)
    || /That team name is already used in this season/i.test(message)
    || /Trade blocked: player still has an active team membership/i.test(message)
    || /already pending/i.test(message)
    || /no longer pending/i.test(message)
    || /Membership request is already pending/i.test(message)
    || /Invitation is no longer pending/i.test(message)
    || /Membership request is no longer pending/i.test(message)
    || /Returning team slot is no longer awaiting a response/i.test(message)
    || /Player profile is required/i.test(message)
    || /Teams can only be added before season publication/i.test(message)
    || /No team slots are currently available/i.test(message)
    || /Active team membership is required/i.test(message)
    || /Rostered players cannot register as free agents/i.test(message)
    || /Active season registration is required/i.test(message)
    || /not a scheduled league date/i.test(message)
    || /Active captains must keep/i.test(message)
    || /before closing/i.test(message)
    || /still need/i.test(message)
    || /last league admin/i.test(message)
    || /captain lifecycle/i.test(message)
    || /Phone number is required/i.test(message)
    || /must be qualified before it can take a season slot/i.test(message)
    || /already exists/i.test(message)
    || /regular season/i.test(message)
    || /Postseason/i.test(message)
    || /semifinal|championship/i.test(message)
    || /team_applications_active_captain_unique/i.test(message)
    || /team_applications_active_name_unique/i.test(message)
    || /one_active_team_membership_per_player_season/i.test(message)
    || /one_active_captain_team_per_season/i.test(message)
    || /teams_season_id_name_key/i.test(message)
    || /direct_conversations_season_id_player_low_id_player_high_id_key/i.test(message)
    || /conversation with this player already exists/i.test(message)
  ) {
    return 409;
  }

  return 400;
}
