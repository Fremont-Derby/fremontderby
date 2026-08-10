export function renderLineupPage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Fremont Derby Lineup</title>
  <style>
    :root {
      color-scheme: dark;
      font-family: Inter, ui-sans-serif, system-ui, sans-serif;
      background: #111316;
      color: #f5f1e9;
      --panel: #191d22;
      --line: #343c45;
      --muted: #aab3bb;
      --green: #2fa972;
      --gold: #d8ad3f;
      --blue: #4e83d6;
      --red: #d45b50;
    }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; background: #111316; }
    button, input, select { font: inherit; }
    button {
      min-height: 44px;
      border: 1px solid transparent;
      border-radius: 8px;
      font-weight: 850;
      cursor: pointer;
    }
    button:disabled { cursor: not-allowed; opacity: .5; }
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
      border-radius: 8px;
      display: grid;
      place-items: center;
      color: #0d1511;
      background: var(--green);
      font-weight: 950;
    }
    .status { min-height: 32px; color: var(--muted); text-align: right; }
    .status[data-tone="error"] { color: #ffb1aa; }
    .status[data-tone="ok"] { color: #9ee5bd; }
    .setup {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) auto;
      gap: 10px;
      padding: 14px 0;
      border-bottom: 1px solid var(--line);
    }
    label { display: grid; gap: 6px; color: var(--muted); font-size: .78rem; font-weight: 850; }
    input, select {
      width: 100%;
      min-height: 44px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #0d1013;
      color: #f5f1e9;
      padding: 0 12px;
    }
    .load { align-self: end; background: var(--gold); color: #12100a; }
    .grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      gap: 14px;
      padding-top: 14px;
    }
    .panel {
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--panel);
      overflow: hidden;
      min-width: 0;
    }
    .panel-head {
      min-height: 48px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 0 12px;
      border-bottom: 1px solid var(--line);
      font-weight: 900;
    }
    .slots { display: grid; gap: 10px; padding: 12px; }
    .slot-grid { display: grid; grid-template-columns: 76px minmax(0, 1fr); gap: 10px; align-items: end; }
    .slot-number {
      min-height: 44px;
      border-radius: 8px;
      display: grid;
      place-items: center;
      background: #222932;
      color: var(--gold);
      font-weight: 950;
    }
    .submit { background: var(--green); color: #06120d; }
    .refresh { background: transparent; color: #f5f1e9; border-color: var(--line); }
    .stack-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 0 12px 12px; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    th, td { padding: 12px; border-bottom: 1px solid var(--line); text-align: left; vertical-align: middle; }
    th { color: var(--muted); font-size: .75rem; text-transform: uppercase; }
    td { overflow-wrap: anywhere; }
    tr:last-child td { border-bottom: 0; }
    .numeric { text-align: right; font-variant-numeric: tabular-nums; }
    .badge {
      display: inline-flex;
      align-items: center;
      min-height: 28px;
      border-radius: 999px;
      padding: 0 10px;
      font-size: .78rem;
      font-weight: 900;
      background: #26303a;
      color: #d8e4ea;
    }
    .badge.available { background: rgba(47, 169, 114, .18); color: #9ee5bd; }
    .badge.unavailable { background: rgba(212, 91, 80, .18); color: #ffb1aa; }
    .badge.unsure { background: rgba(216, 173, 63, .18); color: #f0d48b; }
    .empty { padding: 16px; color: var(--muted); }
    @media (max-width: 860px) {
      .app { padding: 12px; }
      .topbar { align-items: flex-start; }
      .setup, .grid, .stack-actions { grid-template-columns: 1fr; }
      .status { text-align: left; }
      .panel { overflow-x: auto; }
      table { min-width: 640px; }
    }
  </style>
</head>
<body>
  <main class="app">
    <header class="topbar">
      <div class="brand"><span class="mark">L</span><span>Fremont Derby Lineup</span></div>
      <div class="status" data-status>Ready</div>
    </header>

    <form class="setup" data-form>
      <label>Team ID
        <input name="teamId" data-team-id autocomplete="off" />
      </label>
      <label>Round ID
        <input name="roundId" data-round-id autocomplete="off" />
      </label>
      <label>Access token
        <input name="token" data-token type="password" autocomplete="current-password" />
      </label>
      <button class="load" type="submit">Load</button>
    </form>

    <section class="grid">
      <article class="panel">
        <div class="panel-head"><span>Availability</span><span data-availability-count class="badge">0</span></div>
        <table>
          <thead>
            <tr>
              <th>Player</th>
              <th>Type</th>
              <th>Status</th>
              <th class="numeric">Rating</th>
            </tr>
          </thead>
          <tbody data-availability-body></tbody>
        </table>
        <div class="empty" data-availability-empty>No availability loaded.</div>
      </article>

      <article class="panel">
        <div class="panel-head"><span>Lineup</span><span class="badge">4 slots</span></div>
        <div class="slots" data-slots></div>
        <div class="stack-actions">
          <button class="submit" data-submit type="button">Submit lineup</button>
          <button class="refresh" data-refresh type="button">Refresh lineups</button>
        </div>
      </article>
    </section>

    <section class="grid">
      <article class="panel">
        <div class="panel-head"><span>Visible lineups</span><span data-lineup-count class="badge">0</span></div>
        <table>
          <thead>
            <tr>
              <th>Team</th>
              <th class="numeric">Slot</th>
              <th>Player</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody data-lineup-body></tbody>
        </table>
        <div class="empty" data-lineup-empty>No submitted lineup visible.</div>
      </article>
    </section>
  </main>

  <script>
    const form = document.querySelector('[data-form]');
    const teamInput = document.querySelector('[data-team-id]');
    const roundInput = document.querySelector('[data-round-id]');
    const tokenInput = document.querySelector('[data-token]');
    const statusEl = document.querySelector('[data-status]');
    const availabilityBody = document.querySelector('[data-availability-body]');
    const availabilityEmpty = document.querySelector('[data-availability-empty]');
    const availabilityCount = document.querySelector('[data-availability-count]');
    const lineupBody = document.querySelector('[data-lineup-body]');
    const lineupEmpty = document.querySelector('[data-lineup-empty]');
    const lineupCount = document.querySelector('[data-lineup-count]');
    const slotsEl = document.querySelector('[data-slots]');
    const submitButton = document.querySelector('[data-submit]');
    const refreshButton = document.querySelector('[data-refresh]');
    let availabilityRows = [];

    const params = new URLSearchParams(location.search);
    teamInput.value = params.get('team') || localStorage.getItem('fd.lineupTeamId') || '';
    roundInput.value = params.get('round') || localStorage.getItem('fd.lineupRoundId') || '';
    tokenInput.value = sessionStorage.getItem('fd.accessToken') || '';

    function setStatus(message, tone) {
      statusEl.textContent = message;
      statusEl.dataset.tone = tone || 'muted';
    }

    function requireInputs() {
      const teamId = teamInput.value.trim();
      const roundId = roundInput.value.trim();
      const token = tokenInput.value.trim();
      if (!teamId) throw new Error('Team ID is required');
      if (!roundId) throw new Error('Round ID is required');
      if (!token) throw new Error('Access token is required');
      localStorage.setItem('fd.lineupTeamId', teamId);
      localStorage.setItem('fd.lineupRoundId', roundId);
      sessionStorage.setItem('fd.accessToken', token);
      return { teamId, roundId, token };
    }

    async function api(path, options) {
      const inputs = requireInputs();
      const url = path
        .replace(':teamId', encodeURIComponent(inputs.teamId))
        .replace(':roundId', encodeURIComponent(inputs.roundId));
      const response = await fetch(url, {
        ...options,
        headers: {
          authorization: 'Bearer ' + inputs.token,
          'content-type': 'application/json',
        },
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || 'Request failed');
      }
      return body;
    }

    function text(value) {
      return value == null || value === '' ? '-' : String(value);
    }

    function cell(value, className) {
      const td = document.createElement('td');
      if (className) td.className = className;
      td.textContent = text(value);
      return td;
    }

    function statusBadge(value) {
      const span = document.createElement('span');
      const status = value || 'unsure';
      span.className = 'badge ' + status;
      span.textContent = status;
      return span;
    }

    function playerLabel(row) {
      const rating = row.fargo_rating == null ? 'unrated' : row.fargo_rating;
      return row.display_name + ' | ' + row.participation_type + ' | ' + text(row.availability_status) + ' | ' + rating;
    }

    function renderAvailability(rows) {
      availabilityRows = rows;
      availabilityBody.replaceChildren();
      availabilityEmpty.hidden = rows.length > 0;
      availabilityCount.textContent = String(rows.length);
      for (const row of rows) {
        const tr = document.createElement('tr');
        const statusCell = document.createElement('td');
        statusCell.append(statusBadge(row.availability_status));
        tr.append(
          cell(row.display_name),
          cell(row.participation_type),
          statusCell,
          cell(row.fargo_rating, 'numeric'),
        );
        availabilityBody.append(tr);
      }
      renderSlots();
    }

    function renderSlots() {
      const previous = Array.from(slotsEl.querySelectorAll('select')).map((select) => select.value);
      slotsEl.replaceChildren();
      for (let index = 0; index < 4; index += 1) {
        const row = document.createElement('div');
        row.className = 'slot-grid';
        const number = document.createElement('div');
        number.className = 'slot-number';
        number.textContent = String(index + 1);
        const label = document.createElement('label');
        label.textContent = 'Player';
        const select = document.createElement('select');
        select.dataset.slot = String(index + 1);
        const forfeit = document.createElement('option');
        forfeit.value = '';
        forfeit.textContent = 'Forfeit slot';
        select.append(forfeit);
        for (const player of availabilityRows) {
          const option = document.createElement('option');
          option.value = player.player_id;
          option.textContent = playerLabel(player);
          select.append(option);
        }
        select.value = previous[index] || '';
        label.append(select);
        row.append(number, label);
        slotsEl.append(row);
      }
    }

    function renderLineups(rows) {
      lineupBody.replaceChildren();
      lineupEmpty.hidden = rows.length > 0;
      lineupCount.textContent = String(rows.length);
      for (const row of rows) {
        const tr = document.createElement('tr');
        tr.append(
          cell(row.is_own_team ? 'Own' : 'Opponent'),
          cell(row.slot_number, 'numeric'),
          cell(row.display_name || (row.player_id ? row.player_id : 'Forfeit')),
          cell(row.participation_type),
        );
        lineupBody.append(tr);
      }
    }

    async function loadAvailability() {
      const body = await api('/api/teams/:teamId/rounds/:roundId/availability', { method: 'GET' });
      renderAvailability(body.availability || []);
    }

    async function loadLineups() {
      const body = await api('/api/teams/:teamId/rounds/:roundId/lineup', { method: 'GET' });
      renderLineups(body.lineups || []);
    }

    async function loadPage() {
      setStatus('Loading...');
      await Promise.all([loadAvailability(), loadLineups()]);
      setStatus('Lineup data loaded', 'ok');
    }

    async function submitLineup() {
      const selected = Array.from(slotsEl.querySelectorAll('select'));
      const playerIds = selected.map((select) => select.value).filter(Boolean);
      if (new Set(playerIds).size !== playerIds.length) {
        throw new Error('Lineup players must be unique');
      }
      const slots = selected.map((select) => ({
        slotNumber: Number(select.dataset.slot),
        playerId: select.value || '',
      }));
      setStatus('Submitting lineup...');
      await api('/api/teams/:teamId/rounds/:roundId/lineup', {
        method: 'POST',
        body: JSON.stringify({ slots }),
      });
      await loadLineups();
      setStatus('Lineup submitted', 'ok');
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
      run(loadPage);
    });
    submitButton.addEventListener('click', () => run(submitLineup));
    refreshButton.addEventListener('click', () => run(loadLineups));
    renderSlots();
    if (teamInput.value && roundInput.value && tokenInput.value) {
      run(loadPage);
    }
  </script>
</body>
</html>`;
}
