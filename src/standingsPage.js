export function renderStandingsPage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Fremont Derby Standings</title>
  <style>
    :root {
      color-scheme: dark;
      font-family: Inter, ui-sans-serif, system-ui, sans-serif;
      background: #101214;
      color: #f5f0e8;
      --panel: #191c1f;
      --line: #343b42;
      --muted: #aab2b8;
      --green: #2ea86f;
      --gold: #d9ad38;
      --blue: #4d83d1;
      --red: #d35d4e;
    }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; background: #101214; }
    button, input { font: inherit; }
    button {
      min-height: 42px;
      border-radius: 8px;
      border: 1px solid var(--line);
      cursor: pointer;
      font-weight: 850;
    }
    .app { width: min(1120px, 100%); margin: 0 auto; padding: 16px; }
    .topbar {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
      padding-bottom: 14px;
      border-bottom: 1px solid var(--line);
    }
    .brand { display: flex; align-items: center; gap: 10px; font-weight: 950; }
    .mark {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      background: linear-gradient(90deg, #f5f0e8 0 35%, var(--gold) 35% 65%, #f5f0e8 65%);
      color: #101214;
      font-weight: 950;
    }
    .status { min-height: 32px; color: var(--muted); text-align: right; }
    .status[data-tone="error"] { color: #ffb1aa; }
    .status[data-tone="ok"] { color: #9ee5bd; }
    .controls {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 10px;
      padding: 14px 0;
      border-bottom: 1px solid var(--line);
    }
    label { display: grid; gap: 6px; color: var(--muted); font-size: .78rem; font-weight: 850; }
    input {
      width: 100%;
      min-height: 42px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #0d0f11;
      color: #f5f0e8;
      padding: 0 12px;
    }
    .load { align-self: end; background: var(--gold); color: #101214; border-color: transparent; }
    .tabs { display: flex; gap: 8px; padding: 14px 0; }
    .tab { background: transparent; color: #f5f0e8; padding: 0 14px; }
    .tab[aria-selected="true"] { background: var(--green); color: #06120d; border-color: transparent; }
    .panel {
      border: 1px solid var(--line);
      border-radius: 8px;
      overflow: hidden;
      background: var(--panel);
    }
    .panel[hidden] { display: none; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    th, td { padding: 12px; border-bottom: 1px solid var(--line); text-align: left; vertical-align: middle; }
    th { color: var(--muted); font-size: .75rem; text-transform: uppercase; }
    td { overflow-wrap: anywhere; }
    tr:last-child td { border-bottom: 0; }
    .rank { width: 72px; color: var(--gold); font-weight: 950; }
    .numeric { text-align: right; font-variant-numeric: tabular-nums; }
    .badge {
      display: inline-flex;
      align-items: center;
      min-height: 28px;
      border-radius: 999px;
      padding: 0 10px;
      font-size: .78rem;
      font-weight: 900;
      background: #263039;
      color: #d8e4ea;
    }
    .badge.ok { background: rgba(46, 168, 111, .18); color: #9ee5bd; }
    .badge.warn { background: rgba(217, 173, 56, .18); color: #f0d48b; }
    .empty { padding: 16px; color: var(--muted); }
    @media (max-width: 760px) {
      .app { padding: 12px; }
      .topbar { align-items: flex-start; }
      .controls { grid-template-columns: 1fr; }
      .status { text-align: left; }
      .panel { overflow-x: auto; }
      table { min-width: 720px; }
      .tabs { position: sticky; top: 0; background: #101214; z-index: 1; }
    }
  </style>
</head>
<body>
  <main class="app">
    <header class="topbar">
      <div class="brand"><span class="mark">9</span><span>Fremont Derby Standings</span></div>
      <div class="status" data-status>Ready</div>
    </header>

    <form class="controls" data-form>
      <label>Season ID
        <input name="seasonId" data-season-id autocomplete="off" />
      </label>
      <button class="load" type="submit">Load</button>
    </form>

    <nav class="tabs" aria-label="Standings views">
      <button class="tab" data-tab="teams" type="button" aria-selected="true">Teams</button>
      <button class="tab" data-tab="individuals" type="button" aria-selected="false">Players</button>
    </nav>

    <section class="panel" data-panel="teams">
      <table>
        <thead>
          <tr>
            <th class="rank">Rank</th>
            <th>Team</th>
            <th class="numeric">GP</th>
            <th class="numeric">Max</th>
            <th class="numeric">W-L</th>
            <th class="numeric">Pts</th>
            <th class="numeric">Match</th>
            <th class="numeric">Diff</th>
            <th class="numeric">Forfeit</th>
          </tr>
        </thead>
        <tbody data-team-body></tbody>
      </table>
      <div class="empty" data-team-empty>No team standings loaded.</div>
    </section>

    <section class="panel" data-panel="individuals" hidden>
      <table>
        <thead>
          <tr>
            <th class="rank">Rank</th>
            <th>Player</th>
            <th class="numeric">Record</th>
            <th class="numeric">Win %</th>
            <th class="numeric">Games</th>
            <th class="numeric">Diff</th>
            <th>Prize</th>
          </tr>
        </thead>
        <tbody data-player-body></tbody>
      </table>
      <div class="empty" data-player-empty>No individual standings loaded.</div>
    </section>
  </main>

  <script>
    const form = document.querySelector('[data-form]');
    const seasonInput = document.querySelector('[data-season-id]');
    const statusEl = document.querySelector('[data-status]');
    const teamBody = document.querySelector('[data-team-body]');
    const playerBody = document.querySelector('[data-player-body]');
    const teamEmpty = document.querySelector('[data-team-empty]');
    const playerEmpty = document.querySelector('[data-player-empty]');
    const tabs = Array.from(document.querySelectorAll('[data-tab]'));
    const panels = Array.from(document.querySelectorAll('[data-panel]'));

    seasonInput.value = new URLSearchParams(location.search).get('season') || localStorage.getItem('fd.standingsSeasonId') || '';

    function setStatus(message, tone) {
      statusEl.textContent = message;
      statusEl.dataset.tone = tone || 'muted';
    }

    function cell(text, className) {
      const td = document.createElement('td');
      if (className) td.className = className;
      td.textContent = text == null || text === '' ? '-' : String(text);
      return td;
    }

    function percent(value) {
      const number = Number(value || 0);
      return Math.round(number * 1000) / 10 + '%';
    }

    function badge(text, className) {
      const span = document.createElement('span');
      span.className = 'badge ' + className;
      span.textContent = text;
      return span;
    }

    function renderTeams(rows) {
      teamBody.replaceChildren();
      teamEmpty.hidden = rows.length > 0;
      for (const row of rows) {
        const tr = document.createElement('tr');
        tr.append(
          cell(row.standings_rank, 'rank'),
          cell(row.team_name),
          cell(row.games_played, 'numeric'),
          cell(row.maximum_matches, 'numeric'),
          cell([row.team_wins, row.team_losses].join('-'), 'numeric'),
          cell(row.standing_points, 'numeric'),
          cell(row.match_points + '-' + row.match_points_against, 'numeric'),
          cell(row.point_differential, 'numeric'),
          cell(row.forfeits_won + '-' + row.forfeits_lost, 'numeric'),
        );
        teamBody.append(tr);
      }
    }

    function renderPlayers(rows) {
      playerBody.replaceChildren();
      playerEmpty.hidden = rows.length > 0;
      for (const row of rows) {
        const tr = document.createElement('tr');
        const prize = document.createElement('td');
        prize.append(row.is_prize_eligible
          ? badge('Eligible #' + row.prize_rank, 'ok')
          : badge('Needs ' + row.minimum_matches, 'warn'));
        tr.append(
          cell(row.standings_rank, 'rank'),
          cell(row.display_name),
          cell(row.wins + '-' + row.losses, 'numeric'),
          cell(percent(row.win_percentage), 'numeric'),
          cell(row.games_won + '-' + row.games_lost, 'numeric'),
          cell(row.game_differential, 'numeric'),
          prize,
        );
        playerBody.append(tr);
      }
    }

    async function loadStandings() {
      const seasonId = seasonInput.value.trim();
      if (!seasonId) throw new Error('Season ID is required');
      localStorage.setItem('fd.standingsSeasonId', seasonId);
      setStatus('Loading...');
      const encoded = encodeURIComponent(seasonId);
      const [teamResponse, playerResponse] = await Promise.all([
        fetch('/api/seasons/' + encoded + '/team-standings'),
        fetch('/api/seasons/' + encoded + '/individual-standings'),
      ]);
      const teamBodyJson = await teamResponse.json();
      const playerBodyJson = await playerResponse.json();
      if (!teamResponse.ok) throw new Error(teamBodyJson.error || 'Team standings failed');
      if (!playerResponse.ok) throw new Error(playerBodyJson.error || 'Individual standings failed');
      renderTeams(teamBodyJson.standings || []);
      renderPlayers(playerBodyJson.standings || []);
      setStatus('Standings loaded', 'ok');
    }

    function selectTab(name) {
      for (const tab of tabs) {
        tab.setAttribute('aria-selected', String(tab.dataset.tab === name));
      }
      for (const panel of panels) {
        panel.hidden = panel.dataset.panel !== name;
      }
    }

    async function run(action) {
      try {
        await action();
      } catch (error) {
        setStatus(error.message, 'error');
      }
    }

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      run(loadStandings);
    });
    for (const tab of tabs) {
      tab.addEventListener('click', () => selectTab(tab.dataset.tab));
    }
    if (seasonInput.value) {
      run(loadStandings);
    }
  </script>
</body>
</html>`;
}