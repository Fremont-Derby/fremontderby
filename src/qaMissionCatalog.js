import { AVAILABILITY_MISSION, buildAvailabilityFixture } from './qaAvailabilityContract.js';
import { CAPTAIN_ADD_PLAYERS_MISSION, buildCaptainAddPlayersFixture } from './qaCaptainAddPlayersContract.js';
import { CAPTAINCY_TRANSFER_MISSION, buildCaptaincyTransferFixture } from './qaCaptaincyTransferContract.js';
import { ELIGIBILITY_MISSION, buildEligibilityFixture } from './qaEligibilityContract.js';
import { FIRST_RACK_MISSION, buildFirstRackFixture } from './qaFirstRackContract.js';
import { MESSAGE_THREAD_MISSION, buildMessageThreadFixture } from './qaMessageThreadContract.js';
import { NEXT_MATCH_MISSION, buildNextMatchFixture } from './qaNextMatchContract.js';
import { PLAYER_DIRECTORY_MISSION, buildPlayerDirectoryFixture } from './qaPlayerDirectoryContract.js';
import { STANDINGS_CONTEXT_MISSION, buildStandingsContextFixture } from './qaStandingsContextContract.js';
import { TEAM_CONTEXT_MISSION, buildTeamContextFixture } from './qaTeamContextContract.js';

export const DRU_QA_MISSIONS = [
  { mission: STANDINGS_CONTEXT_MISSION, build: buildStandingsContextFixture },
  { mission: ELIGIBILITY_MISSION, build: buildEligibilityFixture },
  { mission: MESSAGE_THREAD_MISSION, build: buildMessageThreadFixture },
  { mission: TEAM_CONTEXT_MISSION, build: buildTeamContextFixture },
  { mission: CAPTAIN_ADD_PLAYERS_MISSION, build: buildCaptainAddPlayersFixture },
  { mission: CAPTAINCY_TRANSFER_MISSION, build: buildCaptaincyTransferFixture },
  { mission: AVAILABILITY_MISSION, build: buildAvailabilityFixture },
  { mission: NEXT_MATCH_MISSION, build: buildNextMatchFixture },
  { mission: FIRST_RACK_MISSION, build: buildFirstRackFixture },
  { mission: PLAYER_DIRECTORY_MISSION, build: buildPlayerDirectoryFixture },
];

export function listDruQaMissionIds() {
  return DRU_QA_MISSIONS.map((entry) => entry.mission.missionId);
}

export function buildDruQaFixture(missionId, seed) {
  const entry = DRU_QA_MISSIONS.find((item) => item.mission.missionId === missionId);
  if (!entry) throw new Error(`Unknown DRU QA mission: ${missionId}`);
  return entry.build(seed);
}
