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
    }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; background: #111313; }
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
    .meta { color: var(--muted); overflow-wrap: anywhere; }
    .badge { display: inline-flex; align-items: center; min-height: 28px; border-radius: 999px; padding: 0 10px; background: #26302f; color: #d8e4de; font-size: .78rem; font-weight: 900; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    th, td { padding: 12px; border-bottom: 1px solid var(--line); text-align: left; vertical-align: middle; }
    th { color: var(--muted); font-size: .75rem; text-transform: uppercase; }
    td { overflow-wrap: anywhere; }
    tr:last-child td { border-bottom: 0; }
    .empty { padding: 16px; color: var(--muted); }
    [hidden] { display: none !important; }
    @media (max-width: 820px) {
      .app { padding: 12px; }
      .topbar { align-items: flex-start; }
      .grid, .actions, .profile-head { grid-template-columns: 1fr; }
      .status { text-align: left; }
      .panel { overflow-x: auto; }
      table { min-width: 620px; }
      .rating { width: 96px; }
    }
  </style>
</head>
<body>
  <main class="app">
    <header class="topbar">
      <div class="brand"><span class="mark">P</span><span>Fremont Derby Profile</span></div>
      <div class="status" data-status>Ready</div>
    </header>

    <section class="grid">
      <article class="panel">
        <div class="panel-head"><span>Session</span><span class="badge" data-session-state>Signed out</span></div>
        <div class="stack" data-auth-form>
          <button class="google" data-google-sign-in type="button">Continue with Google</button>
          <div class="hint">Fremont Derby does not manage passwords. Players and captains use the same Google sign-in.</div>
          <button class="ghost" data-load type="button">Refresh profile</button>
          <button class="danger" data-logout type="button">Sign out</button>
        </div>
      </article>

      <section class="stack">
        <article class="panel">
          <div class="panel-head"><span>Profile</span><span class="badge" data-rating-status>unverified</span></div>
          <div class="stack">
            <div class="profile-head">
              <div>
                <h1 data-display-name>-</h1>
                <div class="meta" data-player-id>-</div>
              </div>
              <div class="rating" data-rating>-</div>
            </div>
            <form class="actions" data-profile-form>
              <label>Display name
                <input name="displayName" data-display-name-input autocomplete="name" maxlength="80" />
              </label>
              <button class="primary" type="submit">Save profile</button>
            </form>
          </div>
        </article>

        <article class="panel">
          <div class="panel-head"><span>Teams</span><span class="badge" data-team-count>0</span></div>
          <table>
            <thead><tr><th>Season</th><th>Team</th><th>Role</th></tr></thead>
            <tbody data-team-body></tbody>
          </table>
          <div class="empty" data-team-empty>No teams loaded.</div>
        </article>

        <article class="panel">
          <div class="panel-head"><span>Seasons</span><span class="badge" data-season-count>0</span></div>
          <table>
            <thead><tr><th>Season</th><th>Type</th><th>Status</th></tr></thead>
            <tbody data-season-body></tbody>
          </table>
          <div class="empty" data-season-empty>No seasons loaded.</div>
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
      sessionState.textContent = accessToken ? 'Signed in' : 'Signed out';
      googleSignInButton.hidden = Boolean(accessToken);
      loadButton.hidden = !accessToken;
      logoutButton.hidden = !accessToken;
    }

    function setStatus(message, tone) {
      statusEl.textContent = message;
      statusEl.dataset.tone = tone || 'muted';
    }

    function text(value) {
      return value == null || value === '' ? '-' : String(value);
    }

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

    function cell(value) {
      const td = document.createElement('td');
      td.textContent = text(value);
      return td;
    }

    function renderRows(bodyEl, emptyEl, countEl, rows, cells) {
      bodyEl.replaceChildren();
      emptyEl.hidden = rows.length > 0;
      countEl.textContent = String(rows.length);
      for (const row of rows) {
        const tr = document.createElement('tr');
        tr.append(...cells(row).map(cell));
        bodyEl.append(tr);
      }
    }

    function renderProfile(profile) {
      document.querySelector('[data-display-name]').textContent = profile ? text(profile.display_name) : '-';
      document.querySelector('[data-player-id]').textContent = profile ? text(profile.id) : '-';
      document.querySelector('[data-rating]').textContent = profile && profile.fargo_rating != null ? String(profile.fargo_rating) : '-';
      document.querySelector('[data-rating-status]').textContent = profile && profile.rating_status ? profile.rating_status : 'unverified';
      displayNameInput.value = profile && profile.display_name ? profile.display_name : '';
      renderRows(teamBody, teamEmpty, teamCount, profile && Array.isArray(profile.teams) ? profile.teams : [], (row) => [row.seasonName, row.teamName, row.role]);
      renderRows(seasonBody, seasonEmpty, seasonCount, profile && Array.isArray(profile.seasons) ? profile.seasons : [], (row) => [row.seasonName, row.participationType, row.status]);
    }

    async function loadProfile() {
      setStatus('Loading...');
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
      setStatus('Saving...');
      const body = await api('/api/me/profile', { method: 'PUT', body: JSON.stringify({ displayName }) });
      renderProfile(body.profile);
      setStatus('Profile saved', 'ok');
    }

    async function signOut() {
      const accessToken = token();
      if (accessToken && config.supabaseUrl && config.supabasePublishableKey) {
        await fetch(config.supabaseUrl.replace(/\\/+$/, '') + '/auth/v1/logout', {
          method: 'POST',
          headers: { apikey: config.supabasePublishableKey, authorization: 'Bearer ' + accessToken },
        }).catch(() => {});
      }
      setSession('', '');
      renderProfile(null);
      setStatus('Signed out');
    }

    async function run(action) {
      try {
        await action();
      } catch (error) {
        setStatus(error.message, 'error');
      }
    }

    googleSignInButton.addEventListener('click', () => run(signInWithGoogle));
    loadButton.addEventListener('click', () => run(loadProfile));
    logoutButton.addEventListener('click', () => run(signOut));
    profileForm.addEventListener('submit', (event) => {
      event.preventDefault();
      run(saveProfile);
    });

    setSession(token(), refreshToken());
    renderProfile(null);
    run(async () => {
      const returnedFromGoogle = consumeOAuthCallback();
      if (returnedFromGoogle || token()) await loadProfile();
    });
  </script>
</body>
</html>`;
}
