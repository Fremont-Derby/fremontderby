export function repairStandingsPageScript(html) {
  return String(html || '')
    .replace(
      "stat('Forfeits',row.forfeits_won+'-'+row.forfeits_lost)]))})\n    function renderPlayers",
      "stat('Forfeits',row.forfeits_won+'-'+row.forfeits_lost)]))})}\n    function renderPlayers",
    )
    .replace(
      "stat('Prize status',prizeBadge,'prize')]))})\n    async function loadStandings",
      "stat('Prize status',prizeBadge,'prize')]))})}\n    async function loadStandings",
    );
}
