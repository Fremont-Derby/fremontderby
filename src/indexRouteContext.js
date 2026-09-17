import { versionMetadata } from './indexShared.js';

export function buildRouteContext(request, env) {

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
    const seasonScheduleMatch = url.pathname.match(
      /^\/api\/seasons\/([^/]+)\/schedule$/,
    );
    const teamStandingsMatch = url.pathname.match(
      /^\/api\/seasons\/([^/]+)\/team-standings$/,
    );
    const individualStandingsMatch = url.pathname.match(
      /^\/api\/seasons\/([^/]+)\/individual-standings$/,
    );
    const seasonPrizesMatch = url.pathname.match(
      /^\/api\/seasons\/([^/]+)\/prizes$/,
    );
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    // Validate season UUID only for allowed methods; non-GET should 405 first.

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

  return {
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
  };
}
