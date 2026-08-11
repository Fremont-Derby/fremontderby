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
    }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; background: #101214; }
    button, select { font: inherit; }
    button {
      min-height: 44px;
      border-radius: 9px;
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
      padding-bottom: 12px;
    }
    .brand { display: flex; align-items: center; gap: 10px; font-weight: 950; font-size: 1.05rem; }
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
    .status { min-height: 24px; color: var(--muted); text-align: right; font-size: .86rem; }
    .status[data-tone="error"] { color: #ffb1aa; }
    .status[data-tone="ok"] { color: #9ee5bd; }
    .tabs-wrap {
      position: sticky;
      top: 0;
      z-index: 5;
      padding: 8px 0 10px;
      background: #101214;
      border-bottom: 1px solid var(--line);
    }
    .tabs {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      padding: 4px;
      border: 1px solid var(--line);
      border-radius: 12px;
      background: #0d0f11;
    }
    .tab {
      min-height: 48px;
      background: transparent;
      color: #f5f0e8;
      border-color: transparent;
      padding: 0 14px;
    }
    .tab[aria-selected="true"] {
      background: var(--green);
      color: #06120d;
      border-color: var(--green);
    }
    .controls {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 10px;
      padding: 14px 0;
    }
    label { display: grid; gap: 6px; color: var(--muted); font-size: .78rem; font-weight: 850; }
    select {
      width: 100%;
      min-height: 44px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #0d0f11;
      color: #f5f0e8;
      padding: 0 12px;
    }
    .load { align-self: end; background: var(--gold); color: #101214; border-color: transparent; padding: 0 16px; }
    .summary {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr)) auto;
      gap: 12px;
      align-items: center;
      margin: 0 0 14px;
      padding: 14px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--panel);
    }
    .summary[hidden], .panel[hidden] { display: none; }
    .metric { display: grid; gap: 3px; }
    .metric strong { color: var(--gold); font-size: 1.2rem; }
    .metric span { color: var(--muted); font-size: .78rem; font-weight: 800; }
    .register-link {
      min-height: 42px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0 14px;
      border-radius: 8px;
      background: var(--green);
      color: #06120d;
      text-decoration: none;
      font-weight: 900;
      white-space: nowrap;
    }
    .panel {
      border: 1px solid var(--line);
      border-radius: 8px;
      overflow: hidden;
      background: var(--panel);
    }
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
      .topbar { align-items: flex-start; flex-direction: column; }
      .status { text-align: left; }
      .controls, .summary { grid-template-columns: 1fr; }
      .panel { overflow-x: auto; }
      table { min-width: 720px; }
      .tab { padding: 0 8px; }
    }
  </style>
</head>
<body>
  <main class="app">
    <header class="topbar">
      <div class="brand"><span class="mark">9</span><span>Fremont Derby Standings</span></div>
      <div class="status" data-status>Ready</div>
    </header>

    <div class="tabs-wrap">
      <nav class="tabs" role="tablist" aria-label="Standings views">
        <button class="tab" data-tab="teams" role="tab" type="button" aria-selected="true" aria-controls="team-standings">Team standings</button>
        <button class="tab" data-tab="individuals" role="tab" type="button" aria-selected="false" aria-controls="individual-standings">Individual standings</button>
      </nav>
    </div>

    <form class="controls" data-form>
      <label>Season
        <select name="seasonId" data-season-id>
          <option value="">Loading seasons…</option>
        </select>
      </label>
      <button class="load" type="submit">Load</button>
    </form>

    <section class="summary" data-registration-summary hidden>
      <div class="metric"><strong data-team-count>0 / 8</strong><span>Teams registered</span></div>
      <div class="metric"><strong data-player-count>0</strong><span>Rostered players</span></div>
      <div class="metric"><strong data-open-slots>8</strong><span>Open team slots</span></div>
      <a class="register-link" data-register-link href="/teams">Register or join a team</a>
    </section>

    <section class="panel" id="team-standings" role="tabpanel" data-panel="teams">
      <table>
        <thead><tr>
          <th class="rank">Rank</th><th>Team</th><th class="numeric">GP</th><th class="numeric">Max</th>
          <th class="numeric">W-L</th><th class="numeric">Pts</th><th class="numeric">Match</th>
          <th class="numeric">Diff</th><th class="numeric">Forfeit</th>
        </tr></thead>
        <tbody data-team-body></tbody>
      </table>
      <div class="empty" data-team-empty>No team standings loaded.</div>
    </section>

    <section class="panel" id="individual-standings" role="tabpanel" data-panel="individuals" hidden>
      <table>
        <thead><tr>
          <th class="rank">Rank</th><th>Player</th><th class="numeric">Record</th><th class="numeric">Win %</th>
          <th class="numeric">Games</th><th class="numeric">Diff</th><th>Prize</th>
        </tr></thead>
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
    const registrationSummary = document.querySelector('[data-registration-summary]');
    const teamCountEl = document.querySelector('[data-team-count]');
    const playerCountEl = document.querySelector('[data-player-count]');
    const openSlotsEl = document.querySelector('[data-open-slots]');
    const registerLink = document.querySelector('[data-register-link]');
    const query = new URLSearchParams(location.search);
    const requestedSeasonId = query.get('season') || '';
    const rememberedSeasonId = localStorage.getItem('fd.standingsSeasonId') || '';
    const requestedView = query.get('view');
    const rememberedView = localStorage.getItem('fd.standingsView');
    let seasons = [];

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

    function selectTab(name, persist = true) {
      const selected = name === 'individuals' ? 'individuals' : 'teams';
      for (const tab of tabs) {
        tab.setAttribute('aria-selected', String(tab.dataset.tab === selected));
      }
      for (const panel of panels) {
        panel.hidden = panel.dataset.panel !== selected;
      }
      if (persist) {
        localStorage.setItem('fd.standingsView', selected);
        const next = new URL(location.href);
        next.searchParams.set('view', selected);
        history.replaceState(null, '', next.pathname + next.search + next.hash);
      }
    }

    function renderSeasonOptions() {
      seasonInput.replaceChildren();
      for (const season of seasons) {
        const option = document.createElement('option');
        option.value = season.id;
        option.textContent = season.name + ' — ' + season.status;
        seasonInput.append(option);
      }
      const explicit = seasons.find((season) => season.id === requestedSeasonId);
      const registration = seasons.find((season) => season.status === 'registration');
      const remembered = seasons.find((season) => season.id === rememberedSeasonId);
      const selected = explicit || registration || remembered || seasons[0];
      seasonInput.value = selected?.id || '';
      seasonInput.disabled = seasons.length === 0;
    }

    function renderRegistrationSummary(season) {
      registrationSummary.hidden = !season;
      if (!season) return;
      teamCountEl.textContent = season.teamCount + ' / ' + season.teamCapacity;
      playerCountEl.textContent = String(season.rosteredPlayerCount);
      openSlotsEl.textContent = String(season.openTeamSlots);
      registerLink.href = '/teams?season=' + encodeURIComponent(season.id);
      registerLink.textContent = season.status === 'registration' ? 'Register or join a team' : 'View teams';
    }

    async function loadSeasons() {
      setStatus('Loading seasons...');
      const response = await fetch('/api/seasons');
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Season list failed');
      seasons = body.seasons || [];
      renderSeasonOptions();
      if (!seasons.length) {
        renderRegistrationSummary(null);
        throw new Error('No seasons are available yet.');
      }
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
      const teamRows = teamBodyJson.standings || [];
      const playerRows = playerBodyJson.standings || [];
      const season = seasons.find((candidate) => candidate.id === seasonId);
      renderTeams(teamRows);
      renderPlayers(playerRows);
      renderRegistrationSummary(season);
      teamEmpty.textContent = !teamRows.length && season?.status === 'registration'
        ? season.teamCount + ' of ' + season.teamCapacity + ' teams are registered. Standings begin after league play starts.'
        : 'No team standings are available for this season.';
      playerEmpty.textContent = !playerRows.length && season?.status === 'registration'
        ? 'Player standings begin after scored matches.'
        : 'No individual standings are available for this season.';
      setStatus(season?.status === 'registration' ? 'Registration progress loaded' : 'Standings loaded', 'ok');
    }

    async function run(action) {
      try { await action(); }
      catch (error) { setStatus(error.message, 'error'); }
    }

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      run(loadStandings);
    });
    for (const tab of tabs) {
      tab.addEventListener('click', () => selectTab(tab.dataset.tab));
    }

    selectTab(requestedView || rememberedView || 'teams', false);
    run(async () => {
      await loadSeasons();
      await loadStandings();
    });
  </script>
</body>
</html>`;
}
