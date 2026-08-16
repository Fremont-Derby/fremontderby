/**
 * #354 Captain roster match counts — pure helpers.
 * "for us" = official regular-season matches for this team only (qualification).
 * "elsewhere" = same-season matches for other teams (context only).
 */

export function accumulateMatchCounts(rows, teamId) {
  const counts = new Map();
  for (const row of rows || []) {
    for (const side of ['a', 'b']) {
      const pid = row[`player_${side}_id`];
      if (!pid) continue;
      const entry = counts.get(pid) || { forUs: 0, elsewhere: 0, elsewhereByTeam: new Map() };
      const sideTeamId = side === 'a' ? row.team_a_id : row.team_b_id;
      const onThisTeam = sideTeamId === teamId;
      if (onThisTeam) {
        entry.forUs += 1;
      } else {
        entry.elsewhere += 1;
        if (sideTeamId) {
          entry.elsewhereByTeam.set(sideTeamId, (entry.elsewhereByTeam.get(sideTeamId) || 0) + 1);
        }
      }
      counts.set(pid, entry);
    }
  }
  return counts;
}

/**
 * Pool rule from #354:
 * - Foundation: at least 3 roster players with 4+ matches for this team.
 * - Once foundation is met, every roster player with 3+ for this team is playoff-eligible.
 * - Before foundation, only 4+ shows eligible; 3+ is "approaching".
 */
export function evaluateRosterEligibility(rosterCounts) {
  const foundation = rosterCounts.filter((c) => c.forUs >= 4).length >= 3;
  return rosterCounts.map((c) => {
    const postseasonEligible = foundation ? c.forUs >= 3 : c.forUs >= 4;
    const approachingEligible = !postseasonEligible && c.forUs >= 3;
    const need = postseasonEligible ? 0 : Math.max(0, (foundation ? 3 : 4) - c.forUs);
    return { ...c, postseasonEligible, approachingEligible, need, foundationMet: foundation };
  });
}

export function decisionCue({ postseasonEligible, approachingEligible, need }) {
  if (postseasonEligible) return '✓ Playoff eligible';
  if (need === 1) return 'Needs 1';
  if (need > 1) return `Needs ${need}`;
  if (approachingEligible) return '3+ team matches · path to eligible';
  return 'Needs more team matches';
}

export function teamPlayoffSummary(evaluated) {
  const eligible = evaluated.filter((c) => c.postseasonEligible).length;
  const approaching = evaluated.filter((c) => c.approachingEligible).length;
  if (eligible >= 3 || evaluated.some((c) => c.foundationMet)) {
    if (eligible > 0) return `Playoffs ready · ${eligible} eligible`;
  }
  if (eligible + approaching > 0) {
    return `Playoffs: ${eligible} eligible${approaching ? `, ${approaching} close` : ''}`;
  }
  return '';
}

export function formatElsewhereBreakdown(elsewhereByTeam, teamNames = {}) {
  if (!elsewhereByTeam || elsewhereByTeam.size === 0) return '';
  return [...elsewhereByTeam.entries()]
    .map(([id, n]) => `${teamNames[id] || 'Other team'}: ${n}`)
    .join(' · ');
}
