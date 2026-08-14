import { safeAutocompleteClientScript } from './safeAutocomplete.js';
import { friendlyErrorMessage as sharedFriendlyErrorMessage } from './friendlyErrorMessage.js';
function browserConfig(env = {}) {
  return {
    supabaseUrl: env.SUPABASE_URL || '',
    supabasePublishableKey: env.SUPABASE_PUBLISHABLE_KEY || '',
  };
}

function safeJson(value) {
  return JSON.stringify(value).replace(/</g, String.fromCharCode(92) + 'u003c');
}

export function renderProfilePage(env = {}) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Fremont Derby Profile</title>
  <style>
    :root {
      color-scheme: dark;
      font-family: Inter, ui-sans-serif, system-ui, sans-serif;
      background: #111313;
      color: #f6f1e7;
      --panel: #1b1e1f;
      --line: #343b3c;
      --muted: #aab3ae;
      --green: #2fa972;
      --gold: #d8ad3f;
      --red: #d45b50;
      --focus: #9ee5bd;
    }
    * { box-sizing: border-box; }
    input, select, textarea { font-size: 16px; }
    button, a, summary, select { touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
    body { margin: 0; min-height: 100vh; min-height: 100dvh; background: #111313; }
    button, input { font: inherit; }
    button {
      min-height: 44px;
      border: 1px solid transparent;
      border-radius: 8px;
      font-weight: 850;
      cursor: pointer;
    }
    button:disabled { cursor: not-allowed; opacity: .5; }
    button:focus-visible, a:focus-visible, input:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
    input {
      width: 100%;
      min-height: 44px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #0d1010;
      color: #f6f1e7;
      padding: 0 12px;
    }
    label { display: grid; gap: 6px; color: var(--muted); font-size: .78rem; font-weight: 850; }
    .app { width: min(1080px, 100%); margin: 0 auto; padding: 16px; }
    .topbar { display: flex; justify-content: space-between; gap: 12px; align-items: center; padding-bottom: 14px; border-bottom: 1px solid var(--line); }
    .brand { display: flex; align-items: center; gap: 10px; font-weight: 950; }
    .mark { width: 32px; height: 32px; border-radius: 8px; display: grid; place-items: center; color: #0d1511; background: var(--green); font-weight: 950; }
    .status { min-height: 32px; color: var(--muted); text-align: right; }
    .status[data-tone="error"] { color: #ffb1aa; }
    .status[data-tone="ok"] { color: #9ee5bd; }
    .grid { display: grid; grid-template-columns: 360px minmax(0, 1fr); gap: 14px; padding-top: 14px; align-items: start; }
    .panel { border: 1px solid var(--line); border-radius: 8px; background: var(--panel); min-width: 0; overflow: hidden; }
    .panel-head { min-height: 48px; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 0 12px; border-bottom: 1px solid var(--line); font-weight: 900; }
    .stack { display: grid; gap: 12px; padding: 12px; }
    .actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .google { background: #fff; color: #202124; border-color: #dadce0; width: 100%; }
    .primary { background: var(--green); color: #06120d; }
    .ghost { background: transparent; color: #f6f1e7; border-color: var(--line); }
    .danger { background: var(--red); color: #1a0604; }
    .hint { color: var(--muted); font-size: .86rem; line-height: 1.45; }
    .profile-head { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 12px; align-items: center; }
    h1 { margin: 0; font-size: 2rem; line-height: 1.05; }
    .rating { min-width: 96px; min-height: 72px; border-radius: 8px; display: grid; place-items: center; background: #222928; color: var(--gold); font-size: 2rem; font-weight: 950; font-variant-numeric: tabular-nums; }
    .badge { display: inline-flex; align-items: center; min-height: 28px; border-radius: 999px; padding: 0 10px; background: #26302f; color: #d8e4de; font-size: .78rem; font-weight: 900; }
    .admin-tools { border-color: #5c4d24; background: linear-gradient(145deg, #252113, #171b19 58%); box-shadow: inset 0 1px 0 rgba(255,255,255,.04); }
    .admin-tools .panel-head { border-bottom-color: #5c4d24; }
    .admin-actions { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; padding: 12px; }
    .admin-actions a { min-height: 48px; display: flex; align-items: center; justify-content: center; padding: 10px 12px; border: 1px solid #6d5a29; border-radius: 10px; background: #2b2615; color: #f6e6af; text-decoration: none; text-align: center; font-weight: 900; }
    table { width: 100%; min-width: 0; border-collapse: collapse; table-layout: fixed; }
    th, td { padding: 12px; border-bottom: 1px solid var(--line); text-align: left; vertical-align: middle; }
    th { color: var(--muted); font-size: .75rem; text-transform: uppercase; }
    td { overflow-wrap: anywhere; word-break: break-word; }
    tr:last-child td { border-bottom: 0; }
    .empty { padding: 16px; color: var(--muted); line-height: 1.5; }
    .empty a { color: #b9e8ca; font-weight: 850; }
    [hidden] { display: none !important; }
    @media (max-width: 820px) {
      .app { padding: 12px; }
      .topbar { display: grid; align-items: flex-start; }
      .grid, .actions, .profile-head, .admin-actions { grid-template-columns: 1fr; }
      .status { text-align: left; }
      .panel { overflow: hidden; }
      .rating { width: 96px; }
      table { width: 100%; min-width: 0; table-layout: fixed; }
      thead { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
      tbody, tr, td { display: block; width: 100%; }
      tr { padding: 8px 12px; border-bottom: 1px solid var(--line); }
      tr:last-child { border-bottom: 0; }
      td { display: grid; grid-template-columns: 82px minmax(0, 1fr); gap: 10px; padding: 5px 0; border: 0; }
      td::before { content: attr(data-label); color: var(--muted); font-size: .72rem; font-weight: 900; text-transform: uppercase; }
    }
  </style>
</head>
<body>
  <main class="app">
    <header class="topbar">
      <div class="brand"><span class="mark">P</span><span>Fremont Derby Profile</span></div>
      <div class="status" role="status" aria-live="polite" aria-atomic="true" data-status></div>
    </header>

    <section class="grid">
      <article class="panel">
        <div class="panel-head"><span>Session</span><span class="badge" data-session-state>Signed out</span></div>
        <div class="stack" data-auth-form>
          <div class="hint" data-signed-out-copy>Sign in with Google to manage your profile, teams, availability, messages, and league-night scoring. Fremont Derby does not manage passwords.</div>
          <button class="google" data-google-sign-in type="button">Continue with Google</button>
          <div class="hint" data-signed-in-copy hidden>You are signed in. Refresh if another league action changed your profile, team, or season state.</div>
          <button class="ghost" data-load type="button">Refresh profile</button>
          <button class="danger" data-logout type="button">Sign out</button>
        </div>
      </article>

      <section class="stack" data-authenticated-content hidden>
        <article class="panel">
          <div class="panel-head"><span>Profile</span><span class="badge" data-rating-status>Not rated</span></div>
          <div class="stack">
            <div class="profile-head">
              <h1 data-display-name>Add your name</h1>
              <div class="rating" data-rating>—</div>
            </div>
            <form class="actions" data-profile-form>
              <label>Display name
                <input name="displayName" data-display-name-input autocomplete="name" data-safe-ac="publicPlayers" maxlength="80" />
              </label>
              <button class="primary" type="submit">Save profile</button>
            </form>
          </div>
        </article>

        <article class="panel admin-tools" data-admin-tools hidden>
          <div class="panel-head"><span>League admin</span><span class="badge">Admin tools</span></div>
          <div class="hint" style="padding:12px 12px 0">Manage players, league health, season setup, and reported messages.</div>
          <nav class="admin-actions" aria-label="League admin tools">
            <a href="/admin/players">Players</a>
            <a href="/admin/operations">Operations</a>
            <a href="/season-setup">Season setup</a>
            <a href="/messages/moderation">Moderation</a>
          </nav>
        </article>

        <article class="panel">
          <div class="panel-head"><span>Teams</span><span class="badge" data-team-count>—</span></div>
          <table>
            <thead><tr><th>Season</th><th>Team</th><th>Role</th></tr></thead>
            <tbody data-team-body></tbody>
          </table>
          <div class="empty" data-team-empty>Loading team memberships…</div>
        </article>

        <article class="panel">
          <div class="panel-head"><span>Seasons</span><span class="badge" data-season-count>—</span></div>
          <table>
            <thead><tr><th>Season</th><th>Type</th><th>Status</th></tr></thead>
            <tbody data-season-body></tbody>
          </table>
          <div class="empty" data-season-empty>Loading season participation…</div>
        </article>
      </section>
    </section>
  </main>

  <script>
    const config = ${safeJson(browserConfig(env))};
    const profileForm = document.querySelector('[data-profile-form]');
    const displayNameInput = document.querySelector('[data-display-name-input]');
    const statusEl = document.querySelector('[data-status]');
    const sessionState = document.querySelector('[data-session-state]');
    const googleSignInButton = document.querySelector('[data-google-sign-in]');
    const loadButton = document.querySelector('[data-load]');
    const logoutButton = document.querySelector('[data-logout]');
    const signedOutCopy = document.querySelector('[data-signed-out-copy]');
    const signedInCopy = document.querySelector('[data-signed-in-copy]');
    const authenticatedContent = document.querySelector('[data-authenticated-content]');
    const adminTools = document.querySelector('[data-admin-tools]');
    const teamBody = document.querySelector('[data-team-body]');
    const teamEmpty = document.querySelector('[data-team-empty]');
    const teamCount = document.querySelector('[data-team-count]');
    const seasonBody = document.querySelector('[data-season-body]');
    const seasonEmpty = document.querySelector('[data-season-empty]');
    const seasonCount = document.querySelector('[data-season-count]');

    function token() {
      return sessionStorage.getItem('fd.accessToken') || '';
    }

    function refreshToken() {
      return sessionStorage.getItem('fd.refreshToken') || '';
    }

    function setStatus(message, tone) {
      statusEl.textContent = message;
      statusEl.dataset.tone = tone || 'muted';
    }

    function setSession(accessToken, nextRefreshToken = '') {
      if (accessToken) {
        sessionStorage.setItem('fd.accessToken', accessToken);
      } else {
        sessionStorage.removeItem('fd.accessToken');
      }
      if (nextRefreshToken) {
        sessionStorage.setItem('fd.refreshToken', nextRefreshToken);
      } else if (!accessToken) {
        sessionStorage.removeItem('fd.refreshToken');
      }
      const signedIn = Boolean(accessToken);
      sessionState.textContent = signedIn ? 'Signed in' : 'Signed out';
      googleSignInButton.hidden = signedIn;
      loadButton.hidden = !signedIn;
      logoutButton.hidden = !signedIn;
      signedOutCopy.hidden = signedIn;
      signedInCopy.hidden = !signedIn;
      authenticatedContent.hidden = !signedIn;
      if (!signedIn) {
        adminTools.hidden = true;
        setStatus('Sign in to view your profile');
      }
    }

    function text(value) {
      return value == null || value === '' ? '—' : String(value);
    }

    const friendlyErrorMessage = ${sharedFriendlyErrorMessage.toString()};

    function requireConfig() {
      if (!config.supabaseUrl || !config.supabasePublishableKey) {
        throw new Error('Supabase browser config is missing');
      }
    }

    async function parseJson(response) {
      const textBody = await response.text();
      if (!textBody) return {};
      try {
        return JSON.parse(textBody);
      } catch {
        return { message: textBody };
      }
    }

    async function refreshSession() {
      requireConfig();
      const currentRefreshToken = refreshToken();
      if (!currentRefreshToken) return false;
      const response = await fetch(config.supabaseUrl.replace(/\\/+$/, '') + '/auth/v1/token?grant_type=refresh_token', {
        method: 'POST',
        headers: {
          apikey: config.supabasePublishableKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: currentRefreshToken }),
      });
      if (!response.ok) return false;
      const body = await parseJson(response);
      if (!body.access_token) return false;
      setSession(body.access_token, body.refresh_token || currentRefreshToken);
      return true;
    }

    async function api(path, options, retry = true) {
      const accessToken = token();
      if (!accessToken) throw new Error('Sign in is required');
      const response = await fetch(path, {
        ...options,
        headers: {
          authorization: 'Bearer ' + accessToken,
          'content-type': 'application/json',
        },
      });
      if (response.status === 401 && retry && await refreshSession()) {
        return api(path, options, false);
      }
      const body = await parseJson(response);
      if (!response.ok) {
        throw new Error(body.error || 'Request failed');
      }
      return body;
    }

    async function refreshAdminAccess(retry = true) {
      const accessToken = token();
      adminTools.hidden = true;
      if (!accessToken) return;
      const response = await fetch('/api/admin/operations', {
        headers: { authorization: 'Bearer ' + accessToken },
      }).catch(() => null);
      if (!response) return;
      if (response.status === 401 && retry && await refreshSession()) {
        return refreshAdminAccess(false);
      }
      adminTools.hidden = response.status !== 200;
    }

    function cell(label, value) {
      const td = document.createElement('td');
      td.dataset.label = label;
      td.textContent = text(value);
      return td;
    }

    function setEmptyAction(element, message, href, label) {
      element.replaceChildren();
      const copy = document.createElement('span');
      copy.textContent = message + ' ';
      const link = document.createElement('a');
      link.href = href;
      link.textContent = label;
      element.append(copy, link);
    }

    function renderRows(bodyEl, emptyEl, countEl, rows, cells, emptyState) {
      bodyEl.replaceChildren();
      emptyEl.hidden = rows.length > 0;
      countEl.textContent = String(rows.length);
      for (const row of rows) {
        const tr = document.createElement('tr');
        tr.append(...cells(row).map(([label, value]) => cell(label, value)));
        bodyEl.append(tr);
      }
      if (!rows.length) setEmptyAction(emptyEl, ...emptyState);
    }

    function setHistoryLoading() {
      teamBody.replaceChildren();
      seasonBody.replaceChildren();
      teamCount.textContent = '—';
      seasonCount.textContent = '—';
      teamEmpty.hidden = false;
      seasonEmpty.hidden = false;
      teamEmpty.textContent = 'Loading team memberships…';
      seasonEmpty.textContent = 'Loading season participation…';
    }

    function renderProfile(profile) {
      document.querySelector('[data-display-name]').textContent = profile && profile.display_name ? profile.display_name : 'Add your name';
      document.querySelector('[data-rating]').textContent = profile && profile.fargo_rating != null ? String(profile.fargo_rating) : '—';
      document.querySelector('[data-rating-status]').textContent = profile && profile.rating_status ? profile.rating_status : 'Not rated';
      displayNameInput.value = profile && profile.display_name ? profile.display_name : '';
      const teams = profile && Array.isArray(profile.teams) ? profile.teams : [];
      const seasons = profile && Array.isArray(profile.seasons) ? profile.seasons : [];
      renderRows(
        teamBody,
        teamEmpty,
        teamCount,
        teams,
        (row) => [['Season', row.seasonName], ['Team', row.teamName], ['Role', row.role]],
        ['No team memberships yet.', '/teams', 'Browse teams'],
      );
      renderRows(
        seasonBody,
        seasonEmpty,
        seasonCount,
        seasons,
        (row) => [['Season', row.seasonName], ['Type', row.participationType], ['Status', row.status]],
        ['No season participation yet.', '/schedule', 'View the league schedule'],
      );
    }

    async function loadProfile() {
      setStatus('Loading profile…');
      setHistoryLoading();
      const body = await api('/api/me/profile', { method: 'GET' });
      renderProfile(body.profile);
      setStatus('Profile loaded', 'ok');
    }

    function signInWithGoogle() {
      requireConfig();
      const baseUrl = config.supabaseUrl.replace(/\\/+$/, '');
      const redirectTo = window.location.origin + '/profile';
      const authorizeUrl = new URL(baseUrl + '/auth/v1/authorize');
      authorizeUrl.searchParams.set('provider', 'google');
      authorizeUrl.searchParams.set('redirect_to', redirectTo);
      window.location.assign(authorizeUrl.toString());
    }

    function consumeOAuthCallback() {
      const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const authError = params.get('error_description') || params.get('error');
      if (authError) {
        history.replaceState({}, '', window.location.pathname + window.location.search);
        throw new Error(authError);
      }
      const accessToken = params.get('access_token');
      if (!accessToken) return false;
      setSession(accessToken, params.get('refresh_token') || '');
      history.replaceState({}, '', window.location.pathname + window.location.search);
      return true;
    }

    async function saveProfile() {
      const displayName = displayNameInput.value.trim();
      if (!displayName) throw new Error('Display name is required');
      setStatus('Saving profile…');
      const body = await api('/api/me/profile', { method: 'PUT', body: JSON.stringify({ displayName }) });
      renderProfile(body.profile);
      setStatus('Profile saved', 'ok');
    }

    async function signOut() {
      const accessToken = token();
      if (accessToken && config.supabaseUrl && config.supabasePublishableKey) {
        await fetch(config.supabaseUrl.replace(/\/+$/, '') + '/auth/v1/logout', {
          method: 'POST',
          headers: { apikey: config.supabasePublishableKey, authorization: 'Bearer ' + accessToken },
        }).catch(() => {});
      }
      setSession('', '');
      // WHY: drop cached API bodies/ETags so the next account cannot see prior PII.
      try {
        const keys = [];
        for (let i = 0; i < sessionStorage.length; i += 1) {
          const key = sessionStorage.key(i);
          if (key && (key.startsWith('fd.body:') || key.startsWith('fd.etag:'))) keys.push(key);
        }
        for (const key of keys) sessionStorage.removeItem(key);
      } catch {}
    }

    async function run(action) {
      try {
        await action();
      } catch (error) {
        setStatus(friendlyErrorMessage(error), 'error');
      }
    }

    googleSignInButton.addEventListener('click', () => run(signInWithGoogle));
    loadButton.addEventListener('click', () => run(loadProfile));
    logoutButton.addEventListener('click', () => run(signOut));
    profileForm.addEventListener('submit', (event) => {
      event.preventDefault();
      run(saveProfile);
    });

    const existingAccessToken = token();
    setSession(existingAccessToken, refreshToken());
    run(async () => {
      const returnedFromGoogle = consumeOAuthCallback();
      if (returnedFromGoogle || token()) {
        await loadProfile();
    if(window.fdLiveRefresh)window.fdLiveRefresh.register(()=>loadProfile().catch(()=>{}),{intervalMs:45000,immediate:false});
        await refreshAdminAccess();
      }
    });
  </script>
${safeAutocompleteClientScript}
</body>
</html>`;
}
