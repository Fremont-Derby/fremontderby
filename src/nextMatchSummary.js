function matchTime(match) {
  const raw = match?.starts_at || match?.startAt || match?.match_date || match?.date || match?.scheduled_at;
  if (!raw) return null;
  const value = Date.parse(raw);
  return Number.isFinite(value) ? value : null;
}

function teamIds(match) {
  return [
    match?.team_id,
    match?.teamId,
    match?.home_team_id,
    match?.homeTeamId,
    match?.away_team_id,
    match?.awayTeamId,
    match?.team_a_id,
    match?.team_b_id,
  ].map((value) => String(value || '').trim()).filter(Boolean);
}

export function pickNextMatch(matches = [], { now = Date.now(), teamId } = {}) {
  const requested = String(teamId || '').trim();
  const upcoming = [];
  for (const match of matches) {
    const time = matchTime(match);
    if (time == null || time < now) continue;
    if (requested && !teamIds(match).includes(requested)) continue;
    upcoming.push({ match, time });
  }
  upcoming.sort((a, b) => a.time - b.time);
  return upcoming[0]?.match || null;
}

export function nextMatchLabel(match) {
  if (!match) return 'No upcoming match published';
  const home = match.home_team_name || match.team_a_name || match.homeTeamName || 'Home';
  const away = match.away_team_name || match.team_b_name || match.awayTeamName || 'Away';
  return `${home} vs ${away}`;
}

export const nextMatchSummaryBrowserSource = `${pickNextMatch.toString()}\n${nextMatchLabel.toString()}`;
