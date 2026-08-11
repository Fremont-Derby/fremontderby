export function renderTeamsPage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Fremont Derby Teams</title>
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
    button, input { font: inherit; }
    button {
      min-height: 44px;
      border: 1px solid transparent;
      border-radius: 8px;
      font-weight: 850;
      cursor: pointer;
    }
    button:disabled { cursor: not-allowed; opacity: .5; }
    input {
      width: 100%;
      min-height: 44px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #0d1013;
      color: #f5f1e9;
      padding: 0 12px;
    }
    label { display: grid; gap: 6px; color: var(--muted); font-size: .78rem; font-weight: 850; }
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
    .primary { background: var(--green); color: #06120d; }
    .secondary { background: var(--gold); color: #12100a; }
    .ghost { background: transparent; color: #f5f1e9; border-color: var(--line); }
    .danger { background: var(--red); color: #1a0604; }
    .grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 14px; padding-top: 14px; }
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
    .invite-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 10px; align-items: end; }
    .split { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 14px; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    th, td { padding: 12px; border-bottom: 1px solid var(--line); text-align: left; vertical-align: middle; }
    th { color: var(--muted); font-size: .75rem; text-transform: uppercase; }
    td { overflow-wrap: anywhere; }
    tr:last-child td { border-bottom: 0; }
    .badge {
      display: inline-flex;
      align-items: center;
      min-height: 28px;
      border-radius: 999px;
      padding: 0 10px;
      background: #26303a;
      color: #d8e4ea;
      font-size: .78rem;
      font-weight: 900;
    }
    .actions { display: flex; flex-wrap: wrap; gap: 8px; }
    .actions button { min-height: 36px; padding: 0 10px; }
    .head-actions { display: flex; align-items: center; gap: 8px; min-width: 0; }
    .chat-link { min-height: 36px; display: inline-flex; align-items: center; padding: 0 11px; border: 1px solid var(--green); border-radius: 8px; color: #9ee5bd; text-decoration: none; font-size: .82rem; font-weight: 900; white-space: nowrap; }
    .empty { padding: 16px; color: var(--muted); }
    @media (max-width: 840px) {
      .app { padding: 12px; }
      .topbar { align-items: flex-start; }
      .setup, .invite-row, .split { grid-template-columns: 1fr; }
      .status { text-align: left; }
      .panel { overflow-x: auto; }
      table { min-width: 680px; }
    }
  </style>
</head>
<body>
  <main class="app">
    <header class="topbar">
      <div class="brand"><span class="mark">T</span><span>Fremont Derby Teams</span></div>
      <div class="status" data-status>Ready</div>
    </header>

    <form class="setup" data-create-form>
      <label>Season ID
        <input name="seasonId" data-season-id autocomplete="off" />
      </label>
      <label>Team name
        <input name="teamName" data-team-name autocomplete="off" maxlength="80" />
      </label>
      <label>Access token
        <input name="token" data-token type="password" autocomplete="current-password" />
      </label>
      <button class="primary" type="submit">Create team</button>
    </form>

    <section class="grid">
      <article class="panel">
        <div class="panel-head"><span>My invitations</span><button class="ghost" data-refresh type="button">Refresh</button></div>
        <div data-invitations></div>
      </article>

      <div data-captain-teams></div>
    </section>
  </main>

  <script>
    const createForm = document.querySelector('[data-create-form]');
    const seasonInput = document.querySelector('[data-season-id]');
    const teamNameInput = document.querySelector('[data-team-name]');
    const tokenInput = document.querySelector('[data-token]');
    const statusEl = document.querySelector('[data-status]');
    const captainTeamsEl = document.querySelector('[data-captain-teams]');
    const invitationsEl = document.querySelector('[data-invitations]');

    const params = new URLSearchParams(location.search);
    seasonInput.value = params.get('season') || localStorage.getItem('fd.teamsSeasonId') || '';
    tokenInput.value = sessionStorage.getItem('fd.accessToken') || '';

    function setStatus(message, tone) {
      statusEl.textContent = message;
      statusEl.dataset.tone = tone || 'muted';
    }

    function token() {
      const value = tokenInput.value.trim();
      if (!value) throw new Error('Access token is required');
      sessionStorage.setItem('fd.accessToken', value);
      return value;
    }

    function rememberSeason() {
      const seasonId = seasonInput.value.trim();
      if (seasonId) localStorage.setItem('fd.teamsSeasonId', seasonId);
      return seasonId;
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

    async function api(path, options) {
      const response = await fetch(path, {
        ...options,
        headers: {
          authorization: 'Bearer ' + token(),
          'content-type': 'application/json',
        },
      });
      const body = await parseJson(response);
      if (!response.ok) {
        throw new Error(body.error || 'Request failed');
      }
      return body;
    }

    function text(value) {
      return value == null || value === '' ? '-' : String(value);
    }

    function cell(value) {
      const td = document.createElement('td');
      td.textContent = text(value);
      return td;
    }

    function actionButton(label, className, dataset) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = className;
      button.textContent = label;
      for (const [key, value] of Object.entries(dataset)) {
        button.dataset[key] = value;
      }
      return button;
    }

    function empty(message) {
      const div = document.createElement('div');
      div.className = 'empty';
      div.textContent = message;
      return div;
    }

    function renderInvitations(invitations) {
      invitationsEl.replaceChildren();
      if (!invitations.length) {
        invitationsEl.append(empty('No pending invitations.'));
        return;
      }

      const table = document.createElement('table');
      const head = document.createElement('thead');
      head.innerHTML = '<tr><th>Season</th><th>Team</th><th>Status</th><th>Actions</th></tr>';
      const body = document.createElement('tbody');
      for (const invitation of invitations) {
        const actions = document.createElement('td');
        const actionWrap = document.createElement('div');
        actionWrap.className = 'actions';
        actionWrap.append(
          actionButton('Accept', 'primary', {
            respondInvitation: invitation.invitationId,
            response: 'accepted',
          }),
          actionButton('Decline', 'danger', {
            respondInvitation: invitation.invitationId,
            response: 'declined',
          }),
        );
        actions.append(actionWrap);

        const row = document.createElement('tr');
        row.append(
          cell(invitation.seasonName),
          cell(invitation.teamName),
          cell(invitation.status),
          actions,
        );
        body.append(row);
      }
      table.append(head, body);
      invitationsEl.append(table);
    }

    function renderRoster(team, body) {
      for (const member of team.roster || []) {
        const actions = document.createElement('td');
        if (member.role !== 'captain') {
          const wrap = document.createElement('div');
          wrap.className = 'actions';
          wrap.append(actionButton('Remove', 'danger', {
            removeMembership: member.membershipId,
          }));
          actions.append(wrap);
        } else {
          actions.textContent = '-';
        }

        const rating = member.fargoRating == null ? 'unrated' : member.fargoRating;
        const row = document.createElement('tr');
        row.append(
          cell(member.displayName),
          cell(member.role),
          cell(rating),
          actions,
        );
        body.append(row);
      }
    }

    function renderPendingInvitations(team, body) {
      for (const invitation of team.pendingInvitations || []) {
        const actions = document.createElement('td');
        const wrap = document.createElement('div');
        wrap.className = 'actions';
        wrap.append(actionButton('Cancel', 'danger', {
          cancelInvitation: invitation.invitationId,
        }));
        actions.append(wrap);

        const row = document.createElement('tr');
        row.append(
          cell(invitation.displayName),
          cell(invitation.status),
          cell(invitation.createdAt),
          actions,
        );
        body.append(row);
      }
    }

    function renderCaptainTeams(teams) {
      captainTeamsEl.replaceChildren();
      if (!teams.length) {
        captainTeamsEl.append(empty('No captained teams loaded.'));
        return;
      }

      for (const team of teams) {
        const panel = document.createElement('article');
        panel.className = 'panel';
        const head = document.createElement('div');
        head.className = 'panel-head';
        const title = document.createElement('span');
        title.textContent = team.teamName + ' | ' + team.seasonName;
        const badge = document.createElement('span');
        badge.className = 'badge';
        badge.textContent = team.teamId;
        const chatLink = document.createElement('a');
        chatLink.className = 'chat-link';
        chatLink.href = '/messages?team=' + encodeURIComponent(team.teamId);
        chatLink.textContent = 'Team chat';
        const headActions = document.createElement('div');
        headActions.className = 'head-actions';
        headActions.append(chatLink, badge);
        head.append(title, headActions);

        const stack = document.createElement('div');
        stack.className = 'stack';

        const inviteRow = document.createElement('div');
        inviteRow.className = 'invite-row';
        const label = document.createElement('label');
        label.textContent = 'Player ID';
        const input = document.createElement('input');
        input.dataset.invitePlayerInput = team.teamId;
        input.autocomplete = 'off';
        label.append(input);
        inviteRow.append(
          label,
          actionButton('Invite player', 'secondary', { inviteTeam: team.teamId }),
        );

        const split = document.createElement('div');
        split.className = 'split';

        const rosterPanel = document.createElement('div');
        rosterPanel.className = 'panel';
        rosterPanel.innerHTML = '<div class="panel-head"><span>Roster</span></div>';
        const rosterTable = document.createElement('table');
        rosterTable.innerHTML = '<thead><tr><th>Player</th><th>Role</th><th>Rating</th><th>Actions</th></tr></thead>';
        const rosterBody = document.createElement('tbody');
        renderRoster(team, rosterBody);
        rosterTable.append(rosterBody);
        rosterPanel.append(rosterTable);

        const invitePanel = document.createElement('div');
        invitePanel.className = 'panel';
        invitePanel.innerHTML = '<div class="panel-head"><span>Pending invites</span></div>';
        if (team.pendingInvitations && team.pendingInvitations.length) {
          const inviteTable = document.createElement('table');
          inviteTable.innerHTML = '<thead><tr><th>Player</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>';
          const inviteBody = document.createElement('tbody');
          renderPendingInvitations(team, inviteBody);
          inviteTable.append(inviteBody);
          invitePanel.append(inviteTable);
        } else {
          invitePanel.append(empty('No pending invites.'));
        }

        split.append(rosterPanel, invitePanel);
        stack.append(inviteRow, split);
        panel.append(head, stack);
        captainTeamsEl.append(panel);
      }
    }

    function renderManagement(data) {
      renderInvitations(data.invitations || []);
      renderCaptainTeams(data.captain_teams || []);
    }

    async function loadTeams() {
      setStatus('Loading...');
      const body = await api('/api/me/teams', { method: 'GET' });
      renderManagement(body.teamManagement || { captain_teams: [], invitations: [] });
      setStatus('Teams loaded', 'ok');
    }

    async function createTeam() {
      const seasonId = rememberSeason();
      const teamName = teamNameInput.value.trim();
      if (!seasonId) throw new Error('Season ID is required');
      if (!teamName) throw new Error('Team name is required');
      setStatus('Creating team...');
      await api('/api/seasons/' + encodeURIComponent(seasonId) + '/teams', {
        method: 'POST',
        body: JSON.stringify({ teamName }),
      });
      teamNameInput.value = '';
      await loadTeams();
    }

    async function invitePlayer(teamId) {
      const input = Array.from(document.querySelectorAll('[data-invite-player-input]'))
        .find((candidate) => candidate.dataset.invitePlayerInput === teamId);
      const playerId = input ? input.value.trim() : '';
      if (!playerId) throw new Error('Player ID is required');
      setStatus('Inviting player...');
      await api('/api/teams/' + encodeURIComponent(teamId) + '/invitations', {
        method: 'POST',
        body: JSON.stringify({ playerId }),
      });
      if (input) input.value = '';
      await loadTeams();
    }

    async function cancelInvitation(invitationId) {
      setStatus('Canceling invitation...');
      await api('/api/team-invitations/' + encodeURIComponent(invitationId) + '/cancel', {
        method: 'POST',
        body: '{}',
      });
      await loadTeams();
    }

    async function removeMember(membershipId) {
      setStatus('Removing member...');
      await api('/api/team-memberships/' + encodeURIComponent(membershipId) + '/remove', {
        method: 'POST',
        body: '{}',
      });
      await loadTeams();
    }

    async function respondToInvitation(invitationId, response) {
      setStatus(response === 'accepted' ? 'Accepting invitation...' : 'Declining invitation...');
      await api('/api/team-invitations/' + encodeURIComponent(invitationId) + '/respond', {
        method: 'POST',
        body: JSON.stringify({ response }),
      });
      await loadTeams();
    }

    async function run(action) {
      try {
        await action();
      } catch (error) {
        setStatus(error.message, 'error');
      }
    }

    createForm.addEventListener('submit', (event) => {
      event.preventDefault();
      run(createTeam);
    });
    document.querySelector('[data-refresh]').addEventListener('click', () => run(loadTeams));
    document.addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (!button) return;
      if (button.dataset.inviteTeam) run(() => invitePlayer(button.dataset.inviteTeam));
      if (button.dataset.cancelInvitation) run(() => cancelInvitation(button.dataset.cancelInvitation));
      if (button.dataset.removeMembership) run(() => removeMember(button.dataset.removeMembership));
      if (button.dataset.respondInvitation) {
        run(() => respondToInvitation(button.dataset.respondInvitation, button.dataset.response));
      }
    });

    renderManagement({ captain_teams: [], invitations: [] });
    if (tokenInput.value) {
      run(loadTeams);
    }
  </script>
</body>
</html>`;
}
