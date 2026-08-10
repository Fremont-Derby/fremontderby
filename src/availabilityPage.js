export function renderAvailabilityPage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Fremont Derby Availability</title>
  <style>
    :root {
      color-scheme: dark;
      font-family: Inter, ui-sans-serif, system-ui, sans-serif;
      background: #111313;
      color: #f6f1e7;
      --panel: #1a1d1d;
      --line: #343a3a;
      --muted: #a9b2ae;
      --green: #2fa56f;
      --gold: #d7a934;
      --red: #d55448;
      --blue: #4b83d8;
    }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; background: #111313; }
    button, input { font: inherit; }
    button {
      min-height: 44px;
      border: 1px solid transparent;
      border-radius: 8px;
      color: #0d1110;
      font-weight: 850;
      cursor: pointer;
    }
    button:disabled { cursor: not-allowed; opacity: .5; }
    input {
      width: 100%;
      min-height: 44px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #0f1111;
      color: #f6f1e7;
      padding: 0 12px;
    }
    label { display: grid; gap: 6px; color: var(--muted); font-size: .78rem; font-weight: 850; }
    .app { width: min(920px, 100%); margin: 0 auto; padding: 16px; }
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
      background: var(--blue);
      color: #07101f;
      font-weight: 950;
    }
    .status { min-height: 32px; color: var(--muted); text-align: right; }
    .status[data-tone="error"] { color: #ffb1aa; }
    .status[data-tone="ok"] { color: #9ee5bd; }
    .setup {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr);
      gap: 10px;
      padding: 14px 0;
      border-bottom: 1px solid var(--line);
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 14px;
      padding-top: 14px;
      align-items: stretch;
    }
    .panel {
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--panel);
      min-width: 0;
      overflow: hidden;
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
    .stack { display: grid; gap: 10px; padding: 12px; }
    .primary { background: var(--green); color: #06120d; }
    .secondary { background: var(--gold); color: #12100a; }
    .unsure { background: var(--blue); color: #07101f; }
    .danger { background: var(--red); color: #1a0604; }
    .badge {
      display: inline-flex;
      align-items: center;
      min-height: 28px;
      border-radius: 999px;
      padding: 0 10px;
      background: #26302f;
      color: #d8e4de;
      font-size: .78rem;
      font-weight: 900;
    }
    .meta { min-height: 44px; color: var(--muted); line-height: 1.5; overflow-wrap: anywhere; }
    @media (max-width: 780px) {
      .app { padding: 12px; }
      .topbar { align-items: flex-start; }
      .setup, .grid { grid-template-columns: 1fr; }
      .status { text-align: left; }
    }
  </style>
</head>
<body>
  <main class="app">
    <header class="topbar">
      <div class="brand"><span class="mark">A</span><span>Fremont Derby Availability</span></div>
      <div class="status" data-status>Ready</div>
    </header>

    <form class="setup" data-setup>
      <label>Season ID
        <input name="seasonId" data-season-id autocomplete="off" />
      </label>
      <label>Round ID
        <input name="roundId" data-round-id autocomplete="off" />
      </label>
      <label>Access token
        <input name="token" data-token type="password" autocomplete="current-password" />
      </label>
    </form>

    <section class="grid">
      <article class="panel">
        <div class="panel-head"><span>Free agent</span><span class="badge" data-free-agent-state>-</span></div>
        <div class="stack">
          <div class="meta">Season registration</div>
          <button class="secondary" data-register type="button">Register</button>
        </div>
      </article>

      <article class="panel">
        <div class="panel-head"><span>Roster availability</span><span class="badge" data-roster-state>-</span></div>
        <div class="stack">
          <button class="primary" data-roster-status="available" type="button">Available</button>
          <button class="unsure" data-roster-status="unsure" type="button">Unsure</button>
          <button class="danger" data-roster-status="unavailable" type="button">Unavailable</button>
        </div>
      </article>

      <article class="panel">
        <div class="panel-head"><span>Free-agent availability</span><span class="badge" data-free-agent-availability-state>-</span></div>
        <div class="stack">
          <button class="primary" data-free-agent-status="available" type="button">Available</button>
          <button class="unsure" data-free-agent-status="unsure" type="button">Unsure</button>
          <button class="danger" data-free-agent-status="unavailable" type="button">Unavailable</button>
        </div>
      </article>
    </section>
  </main>

  <script>
    const seasonInput = document.querySelector('[data-season-id]');
    const roundInput = document.querySelector('[data-round-id]');
    const tokenInput = document.querySelector('[data-token]');
    const statusEl = document.querySelector('[data-status]');
    const freeAgentState = document.querySelector('[data-free-agent-state]');
    const rosterState = document.querySelector('[data-roster-state]');
    const freeAgentAvailabilityState = document.querySelector('[data-free-agent-availability-state]');

    const params = new URLSearchParams(location.search);
    seasonInput.value = params.get('season') || localStorage.getItem('fd.availabilitySeasonId') || '';
    roundInput.value = params.get('round') || localStorage.getItem('fd.availabilityRoundId') || '';
    tokenInput.value = sessionStorage.getItem('fd.accessToken') || '';

    function setStatus(message, tone) {
      statusEl.textContent = message;
      statusEl.dataset.tone = tone || 'muted';
    }

    function requireInputs(scope) {
      const seasonId = seasonInput.value.trim();
      const roundId = roundInput.value.trim();
      const token = tokenInput.value.trim();
      if (scope === 'season' && !seasonId) throw new Error('Season ID is required');
      if (scope === 'round' && !roundId) throw new Error('Round ID is required');
      if (!token) throw new Error('Access token is required');
      if (seasonId) localStorage.setItem('fd.availabilitySeasonId', seasonId);
      if (roundId) localStorage.setItem('fd.availabilityRoundId', roundId);
      sessionStorage.setItem('fd.accessToken', token);
      return { seasonId, roundId, token };
    }

    async function parseJson(response) {
      const text = await response.text();
      if (!text) return {};
      try {
        return JSON.parse(text);
      } catch {
        return { error: text };
      }
    }

    async function api(path, options, scope) {
      const inputs = requireInputs(scope);
      const url = path
        .replace(':seasonId', encodeURIComponent(inputs.seasonId))
        .replace(':roundId', encodeURIComponent(inputs.roundId));
      const response = await fetch(url, {
        ...options,
        headers: {
          authorization: 'Bearer ' + inputs.token,
          'content-type': 'application/json',
        },
      });
      const body = await parseJson(response);
      if (!response.ok) {
        throw new Error(body.error || 'Request failed');
      }
      return body;
    }

    async function registerFreeAgent() {
      setStatus('Registering...');
      await api('/api/seasons/:seasonId/free-agents/me', {
        method: 'POST',
        body: '{}',
      }, 'season');
      freeAgentState.textContent = 'registered';
      setStatus('Registered as free agent', 'ok');
    }

    async function setRosterAvailability(status) {
      setStatus('Saving roster availability...');
      await api('/api/rounds/:roundId/availability/me', {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }, 'round');
      rosterState.textContent = status;
      setStatus('Roster availability saved', 'ok');
    }

    async function setFreeAgentAvailability(status) {
      setStatus('Saving free-agent availability...');
      await api('/api/rounds/:roundId/free-agent-availability/me', {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }, 'round');
      freeAgentAvailabilityState.textContent = status;
      setStatus('Free-agent availability saved', 'ok');
    }

    async function run(action) {
      try {
        await action();
      } catch (error) {
        setStatus(error.message, 'error');
      }
    }

    document.querySelector('[data-register]').addEventListener('click', () => run(registerFreeAgent));
    for (const button of document.querySelectorAll('[data-roster-status]')) {
      button.addEventListener('click', () => run(() => setRosterAvailability(button.dataset.rosterStatus)));
    }
    for (const button of document.querySelectorAll('[data-free-agent-status]')) {
      button.addEventListener('click', () => run(() => setFreeAgentAvailability(button.dataset.freeAgentStatus)));
    }
  </script>
</body>
</html>`;
}
