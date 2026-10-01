export function shouldInsertFreshDruSeason(env = {}, seasonId = null) {
  return String(env.ENVIRONMENT || '').trim() === 'dru' && !seasonId;
}

export function freshSeasonInsert(payload) {
  return {
    name: payload.seasonName,
    status: 'registration',
    league_night: payload.leagueNight,
    first_round_date: payload.firstRoundDate,
    roster_lock_round: payload.rosterLockRound,
    opening_block_length: payload.openingBlockLength,
    individual_min_matches: payload.individualMinMatches,
    round_interval_days: payload.roundIntervalDays,
    default_table_numbers: payload.tableNumbers,
    race_chart_version: payload.raceChartVersion,
    playoff_team_count: payload.playoffTeamCount,
    playoff_anchor_tiebreaker: payload.playoffAnchorTiebreaker !== false,
  };
}

export function freshSeasonSetup(row) {
  if (!row?.id) {
    throw new Error('Fresh DRU season insert did not return an id');
  }
  return row;
}
