const OLD_PRIZE = "prize.append(showPrize?badge('Eligible #'+row.prize_rank,'ok'):(played?badge('Needs '+row.minimum_matches,'warn'):badge('\u2014','muted')));";
const NEW_PRIZE = "const remaining=Math.max(0,(Number(row.minimum_matches)||0)-(Number(row.matches_played)||(Number(row.wins)+Number(row.losses))||0));prize.append(showPrize?badge('Eligible #'+row.prize_rank,'ok'):(played?badge('Needs '+remaining+' more '+(remaining===1?'play':'plays'),'warn'):badge('No matches yet','muted')));";

export function repairStandingsPageScript(html) {
  return String(html || '')
    .replace(
      "stat('Forfeits',row.forfeits_won+'-'+row.forfeits_lost)]))})\n    function renderPlayers",
      "stat('Forfeits',row.forfeits_won+'-'+row.forfeits_lost)]))})}\n    function renderPlayers",
    )
    .replace(
      "stat('Prize status',prizeBadge,'prize')]))})\n    async function loadStandings",
      "stat('Prize status',prizeBadge,'prize')]))})}\n    async function loadStandings",
    )
    .replaceAll(OLD_PRIZE, NEW_PRIZE);
}
