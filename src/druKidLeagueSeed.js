import { KID_LEAGUE_SEASON_NAME, KID_LEAGUE_TEAMS } from './druKidLeagueCatalog.js';

function rowId(row, ...keys) {
  for (const key of keys) {
    if (row?.[key]) return row[key];
  }
  return null;
}

function seasonNameOf(row) {
  return String(row?.name || row?.season_name || row?.seasonName || '').trim();
}

export async function seedDruKidLeague({
  actorUserId,
  listSeasons,
  saveSeasonSetup,
  listSeasonTeams,
  createPreparedTeam,
  addTeamToSeason,
  createPlayer,
  setRosterMembership,
  assignCaptain,
} = {}) {
  if (!actorUserId) throw new Error('actorUserId is required');
  for (const [name, fn] of Object.entries({
    listSeasons, saveSeasonSetup, listSeasonTeams, createPreparedTeam,
    addTeamToSeason, createPlayer, setRosterMembership, assignCaptain,
  })) {
    if (typeof fn !== 'function') throw new Error(`${name} is required`);
  }

  const seasons = await listSeasons();
  let season = (Array.isArray(seasons) ? seasons : []).find(
    (row) => seasonNameOf(row) === KID_LEAGUE_SEASON_NAME,
  );
  let createdSeason = false;

  if (!season) {
    season = await saveSeasonSetup({
      actorUserId,
      seasonId: null,
      seasonName: KID_LEAGUE_SEASON_NAME,
      leagueNight: 'Thursday',
      firstRoundDate: '2026-09-10',
      rosterLockRound: 5,
      openingBlockLength: 3,
      individualMinMatches: 5,
      roundIntervalDays: 7,
      tableNumbers: [1, 2, 3, 4],
      raceChartVersion: 'season-1-default',
      playoffTeamCount: 4,
      playoffAnchorTiebreaker: true,
    });
    createdSeason = true;
  }

  const seasonId = rowId(season, 'id', 'season_id', 'seasonId');
  if (!seasonId) throw new Error('Kids Demo Night season id is missing');

  const existingTeams = await listSeasonTeams({ actorUserId, seasonId });
  const existingNames = new Set(
    (Array.isArray(existingTeams) ? existingTeams : [])
      .map((row) => String(row.teamName || row.team_name || row.name || '').trim())
      .filter(Boolean),
  );

  const teams = [];
  let createdThisCall = 0;
  for (const recipe of KID_LEAGUE_TEAMS) {
    if (existingNames.has(recipe.teamName)) {
      teams.push({ teamName: recipe.teamName, created: false });
      continue;
    }
    if (createdThisCall >= 1) {
      teams.push({ teamName: recipe.teamName, created: false, pending: true });
      continue;
    }

    const prepared = await createPreparedTeam({
      actorUserId,
      seasonId,
      teamName: recipe.teamName,
    });
    const teamId = rowId(prepared, 'team_id', 'teamId', 'id');
    if (!teamId) throw new Error(`Prepared team id missing for ${recipe.teamName}`);

    const captain = await createPlayer({
      actorUserId,
      displayName: recipe.captain,
      allowExactDuplicate: true,
    });
    const captainId = rowId(captain, 'playerId', 'player_id', 'id');
    await setRosterMembership({
      actorUserId,
      playerId: captainId,
      seasonId,
      teamId,
      active: true,
      reason: 'DRU kid-league seed',
    });
    await assignCaptain({
      actorUserId,
      seasonId,
      teamId,
      playerId: captainId,
    });

    const roster = [{ displayName: recipe.captain, role: 'captain', playerId: captainId }];
    for (const displayName of recipe.players) {
      const player = await createPlayer({
        actorUserId,
        displayName,
        allowExactDuplicate: true,
      });
      const playerId = rowId(player, 'playerId', 'player_id', 'id');
      await setRosterMembership({
        actorUserId,
        playerId,
        seasonId,
        teamId,
        active: true,
        reason: 'DRU kid-league seed',
      });
      roster.push({ displayName, role: 'player', playerId });
    }

    let slotError = null;
    try {
      await addTeamToSeason({ actorUserId, seasonId, teamId });
    } catch (error) {
      slotError = error.message;
    }

    teams.push({
      teamName: recipe.teamName,
      teamId,
      created: true,
      roster,
      ...(slotError ? { slotError } : {}),
    });
    createdThisCall += 1;
  }

  return {
    seasonName: KID_LEAGUE_SEASON_NAME,
    seasonId,
    createdSeason,
    createdThisCall,
    pendingCount: teams.filter((team) => team.pending).length,
    complete: teams.every((team) => team.created === false ? existingNames.has(team.teamName) || team.pending !== true : true) && teams.filter((team) => team.pending).length === 0,
    teams,
  };
}
