import { normalizeStatusTone } from './statusTone.js';
export function renderAdminSeasonsPage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Seasons · Fremont Derby Admin</title>
  <style>
    :root{color-scheme:dark;font-family:Inter,ui-sans-serif,system-ui,sans-serif;background:#0d1110;color:#f3f6f4;--panel:#17201c;--line:#31443a;--muted:#a9b8b0;--green:#45b77c;--gold:#e2bd58}
    *{box-sizing:border-box}input,select,textarea{font-size:16px}button,a,summary,.letter-index button,.action{touch-action:manipulation;-webkit-tap-highlight-color:transparent}body{margin:0;background:#0d1110}button,input,select,a{font:inherit}
    button:focus-visible,a:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #9ee5bd;outline-offset:2px}
    .app{width:min(920px,100%);margin:auto;padding:18px}
    .head{display:flex;gap:14px;align-items:flex-start;justify-content:space-between;margin-bottom:16px}
    .head h1{margin:0 0 4px;font-size:clamp(1.7rem,6vw,2.4rem)}.muted{color:var(--muted);line-height:1.45}
    .back{min-height:44px;display:inline-flex;align-items:center;padding:0 14px;border:1px solid var(--line);border-radius:10px;color:#dff0e6;text-decoration:none}
    .panel{border:1px solid var(--line);background:var(--panel);border-radius:14px;padding:14px}
    .tools{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:end}
    label{display:grid;gap:6px;font-weight:800;color:var(--muted);font-size:.85rem}
    input,select{min-height:48px;padding:0 14px;border:1px solid var(--line);border-radius:10px;background:#0b100e;color:#fff}
    .directory-tools{display:grid;gap:8px;margin-top:12px}
    .results-meta{min-height:22px;color:var(--muted);font-weight:700}
    .letter-index{display:flex;flex-wrap:wrap;gap:6px;position:sticky;top:56px;z-index:5;padding:8px 0;background:#0d1110}
    .letter-index button{min-width:44px;min-height:44px;padding:0 10px;border:1px solid var(--line);border-radius:10px;background:#0b100e;color:#dff0e6;font-weight:900;cursor:pointer}
    .letter-index button[aria-pressed="true"]{background:var(--green);color:#07140d;border-color:var(--green)}
    .status{margin:12px 0 0;min-height:24px;color:var(--muted)}
    .status[data-tone=error]{color:#ffb5ae}.status[data-tone=ok]{color:#a9e7c0}
    .list{display:grid;gap:10px;margin-top:14px}
    .card{border:1px solid var(--line);border-radius:12px;padding:14px;background:#121a16;display:grid;gap:8px}
    .card h2{margin:0;font-size:1.15rem}
    .badges{display:flex;flex-wrap:wrap;gap:6px}
    .badge{display:inline-flex;align-items:center;min-height:28px;padding:0 10px;border-radius:999px;background:#24352c;font-size:.78rem;font-weight:850}
    .actions{display:flex;flex-wrap:wrap;gap:8px}
    .actions a{min-height:44px;display:inline-flex;align-items:center;padding:0 14px;border-radius:10px;border:1px solid var(--line);color:#dff0e6;text-decoration:none;font-weight:800}
    .actions a.primary{background:var(--green);color:#07140d;border-color:var(--green)}
    .empty{padding:18px;border:1px dashed var(--line);border-radius:12px;color:var(--muted)}
  @media(max-width:720px){.app{padding-bottom:calc(24px + env(safe-area-inset-bottom,0px))}}</style>
</head>
<body>
  <main class="app">
    <header class="head">
      <div>
        <div class="muted">Admin · League Management</div>
        <h1>Seasons</h1>
        <div class="muted">Find a season by name or status, then jump into setup or season teams without hunting through dropdowns.</div>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:8px">
        <a class="back" href="/admin">Admin home</a>
        <a class="back" href="/admin/season-teams">Season teams</a>
        <a class="back" href="/season-setup">League setup</a>
        <a class="back" href="/admin/players">Players</a>
        <a class="back" href="/admin/audit">Audit</a>
        <a class="back" href="/scorecard">Score</a>
        <a class="back" href="/schedule">Schedule</a>
      </div>
    </header>
    <section class="panel">
      <div class="tools">
        <label for="admin-season-search">Find a season
          <input id="admin-season-search" data-search type="search" autocomplete="off" placeholder="Type part of a season name" aria-label="Search seasons by name" aria-controls="admin-season-list" />
        </label>
        <label for="admin-season-status">Status
          <select id="admin-season-status" data-status-filter aria-label="Filter by season status">
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="registration">Registration</option>
            <option value="active">Active</option>
            <option value="playoffs">Playoffs</option>
            <option value="complete">Complete</option>
            <option value="cancelled">Cancelled</option>
            <option value="archived">Archived</option>
          </select>
        </label>
      </div>
      <div class="directory-tools">
        <div class="results-meta" role="status" aria-live="polite" data-results-meta></div>
        <div class="letter-index" data-letter-index role="group" aria-label="Jump to season name letter"></div>
      </div>
      <div class="status" role="status" aria-live="polite" data-status></div>
      <div class="list" id="admin-season-list" data-list hidden></div>
      <div class="empty" data-empty hidden>No seasons match that search.</div>
    </section>
  </main>
  <script>
    const listEl = document.querySelector('[data-list]');
    const emptyEl = document.querySelector('[data-empty]');
    const statusEl = document.querySelector('[data-status]');
    const searchEl = document.querySelector('[data-search]');
    const statusFilterEl = document.querySelector('[data-status-filter]');
    const resultsMetaEl = document.querySelector('[data-results-meta]');
    const letterIndexEl = document.querySelector('[data-letter-index]');
    let seasons = [];
    let activeLetter = '';

    function token() {
      return sessionStorage.getItem('fd.accessToken') || '';
    }
    const normalizeStatusTone = ${normalizeStatusTone.toString()};
    function setStatus(message, tone = '', opts = {}) {
      if (window.fdSetStatus) {
        if (!message) {
          window.fdSetStatus(statusEl, '', '', opts);
          statusEl.removeAttribute('data-tone');
          return;
        }
        window.fdSetStatus(statusEl, message, tone ? normalizeStatusTone(tone) : '', opts);
        return;
      }
      statusEl.textContent = message;
      if (!message) {
        statusEl.removeAttribute('data-tone');
        return;
      }
      statusEl.dataset.tone = tone ? normalizeStatusTone(tone) : '';
    }
    function normalize(value) {
      return String(value || '').trim().toLowerCase();
    }
    function seasonLetter(season) {
      const name = String(season.name || '').trim();
      const ch = (name[0] || '#').toUpperCase();
      return ch >= 'A' && ch <= 'Z' ? ch : '#';
    }
    function sortedSeasons(list) {
      return list.slice().sort((left, right) => {
        const byName = normalize(left.name).localeCompare(normalize(right.name), 'en', { sensitivity: 'base' });
        if (byName) return byName;
        return String(left.id || '').localeCompare(String(right.id || ''));
      });
    }
    async function api(path) {
      const accessToken = token();
      if (!accessToken) throw new Error('Sign in from Profile to use league admin tools.');
      const response = await fetch(path, {
        headers: { authorization: 'Bearer ' + accessToken, accept: 'application/json' },
      });
      const text = await response.text();
      let body = {};
      try { body = text ? JSON.parse(text) : {}; } catch { body = { error: text }; }
      if (!response.ok) throw new Error(body.error || 'Request failed');
      return body;
    }
    function filteredSeasons() {
      const query = normalize(searchEl.value);
          const tokens = query.trim().split(new RegExp('[ \\t\\n\\r]+')).filter(Boolean);
      const status = statusFilterEl.value;
      let list = sortedSeasons(seasons).filter((season) => {
        if (status && String(season.status || '') !== status) return false;
        if (!tokens.length) return true;
        const hay = normalize(season.name) + ' ' + normalize(season.status);
        return tokens.every((token) => hay.includes(token));
      });
      if (activeLetter) list = list.filter((season) => seasonLetter(season) === activeLetter);
      return list;
    }
    function renderLetterIndex() {
      const present = new Set(sortedSeasons(seasons).map(seasonLetter));
      letterIndexEl.replaceChildren();
      for (const letter of ['#', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']) {
        if (letter !== '#' && !present.has(letter)) continue;
        if (letter === '#' && !present.has('#')) continue;
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = letter;
        button.setAttribute('aria-pressed', String(activeLetter === letter));
        button.addEventListener('click', () => {
          activeLetter = activeLetter === letter ? '' : letter;
          render();
        });
        letterIndexEl.append(button);
      }
    }
    function render() {
      const shown = filteredSeasons();
      const query = normalize(searchEl.value);
      resultsMetaEl.textContent = seasons.length
        ? (shown.length === seasons.length && !query && !activeLetter && !statusFilterEl.value
          ? (seasons.length + ' seasons · A–Z')
          : ('Showing ' + shown.length + ' of ' + seasons.length
            + (query ? ' matching “' + searchEl.value.trim() + '”' : '')
            + (statusFilterEl.value ? ' · ' + statusFilterEl.value : '')
            + (activeLetter ? ' · letter ' + activeLetter : '')))
        : '';
      renderLetterIndex();
      listEl.replaceChildren();
      emptyEl.hidden = shown.length > 0;
      listEl.hidden = shown.length === 0;
      emptyEl.textContent = seasons.length
        ? ((query || activeLetter || statusFilterEl.value)
          ? ('No seasons match '
            + (query ? ('“' + searchEl.value.trim() + '”') : '')
            + (query && (activeLetter || statusFilterEl.value) ? ' ' : '')
            + (activeLetter ? ('letter ' + activeLetter) : '')
            + (activeLetter && statusFilterEl.value ? ' · ' : '')
            + (statusFilterEl.value ? ('status ' + statusFilterEl.value) : '')
            + '.')
          : 'No seasons match that search.')
        : 'No seasons loaded yet.';
      if (seasons.length && shown.length === 0 && (query || activeLetter || statusFilterEl.value)) {
        setStatus(emptyEl.textContent, 'error');
      } else if (seasons.length && shown.length && (query || activeLetter || statusFilterEl.value)) {
        setStatus(shown.length + ' match' + (shown.length === 1 ? '' : 'es') + '.', 'ok');
      }
      for (const season of shown) {
        const card = document.createElement('article');
        card.className = 'card';
        const title = document.createElement('h2');
        title.textContent = season.name || 'Untitled season';
        const badges = document.createElement('div');
        badges.className = 'badges';
        const status = document.createElement('span');
        status.className = 'badge';
        status.textContent = season.status || 'unknown';
        badges.append(status);
        if (season.firstRoundDate || season.first_round_date) {
          const date = document.createElement('span');
          date.className = 'badge';
          date.textContent = 'First round ' + (season.firstRoundDate || season.first_round_date);
          badges.append(date);
        }
        const actions = document.createElement('div');
        actions.className = 'actions';
        const setup = document.createElement('a');
        setup.className = 'primary';
        setup.href = '/season-setup?season=' + encodeURIComponent(season.id);
        setup.textContent = 'Season setup';
        const teams = document.createElement('a');
        teams.href = '/admin/season-teams?season=' + encodeURIComponent(season.id);
        teams.textContent = 'Season teams';
        const standings = document.createElement('a');
        standings.href = '/standings?season=' + encodeURIComponent(season.id);
        standings.textContent = 'Public standings';
        actions.append(setup, teams, standings);
        card.append(title, badges, actions);
        listEl.append(card);
      }
    }
    async function load(opts={}) {
      const quiet = Boolean(opts && opts.quiet);
      if (!quiet) setStatus('Loading seasons…');
      const body = await api('/api/admin/seasons');
      seasons = Array.isArray(body.seasons) ? body.seasons : [];
      render();
      setStatus(seasons.length + ' season' + (seasons.length === 1 ? '' : 's') + ' loaded.', 'ok');
    }
    searchEl.addEventListener('input', () => { activeLetter = ''; render(); });
    searchEl.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        searchEl.value = '';
        activeLetter = '';
        render();
      }
    });
    statusFilterEl.addEventListener('change', () => { activeLetter = ''; render(); });
    load().catch((error) => {
      listEl.hidden = true;
      emptyEl.hidden = true;
      resultsMetaEl.textContent = '';
      letterIndexEl.replaceChildren();
      setStatus((window.fdFriendlyError ? window.fdFriendlyError(error) : error.message), 'error');
    });
    if(window.fdLiveRefresh)window.fdLiveRefresh.register((opts)=>load(opts).catch(()=>{}),{intervalMs:30000,immediate:false});
  </script>
</body>
</html>`;
}
