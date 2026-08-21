import { decorateHtmlWithShell } from './appShell.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function display(value) {
  return value === undefined || value === null || value === '' ? '—' : String(value);
}

function percent(value) {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric)) return '0%';
  return `${Math.round(numeric * 1000) / 10}%`;
}

function rankText(row = {}, tied = false) {
  const rank = row.standings_rank;
  if (rank === undefined || rank === null || rank === '') return '—';
  return tied ? `T-${rank}` : String(rank);
}

function stat(label, value, className = '') {
  return `<div class="fd-standing-stat${className ? ` ${className}` : ''}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(display(value))}</strong></div>`;
}

export function renderTeamStandingCard(row = {}, { tied = false } = {}) {
  const rank = rankText(row, tied);
  return `<article class="fd-standing-row" data-standings-rank="${escapeHtml(row.standings_rank)}">
    <div class="fd-standing-row__identity">
      <span class="fd-standing-row__rank" aria-label="Rank ${escapeHtml(rank)}">${escapeHtml(rank)}</span>
      <div><strong class="fd-standing-row__name">${escapeHtml(row.team_name || 'Unnamed team')}</strong><span class="fd-standing-row__sub">${escapeHtml(display(row.games_played))} of ${escapeHtml(display(row.maximum_matches))} played</span></div>
    </div>
    <div class="fd-standing-row__primary">${stat('Record', `${display(row.team_wins)}-${display(row.team_losses)}`)}${stat('Points', row.standing_points, 'fd-standing-stat--accent')}</div>
    <div class="fd-standing-row__secondary">${stat('Match', `${display(row.match_points)}-${display(row.match_points_against)}`)}${stat('Diff', row.point_differential)}${stat('Forfeit', `${display(row.forfeits_won)}-${display(row.forfeits_lost)}`)}</div>
  </article>`;
}

export function renderIndividualStandingCard(row = {}, { tied = false } = {}) {
  const rank = rankText(row, tied);
  const played = (Number(row.matches_played) || (Number(row.wins) + Number(row.losses))) > 0;
  const prizeStatus = played && row.is_prize_eligible
    ? `Eligible #${display(row.prize_rank)}`
    : (played ? `Needs ${display(row.minimum_matches)}` : 'Not yet ranked');
  return `<article class="fd-standing-row" data-standings-rank="${escapeHtml(row.standings_rank)}">
    <div class="fd-standing-row__identity">
      <span class="fd-standing-row__rank" aria-label="Rank ${escapeHtml(rank)}">${escapeHtml(rank)}</span>
      <div><strong class="fd-standing-row__name">${escapeHtml(row.display_name || 'Unnamed player')}</strong><span class="fd-standing-row__sub">${escapeHtml(prizeStatus)}</span></div>
    </div>
    <div class="fd-standing-row__primary">${stat('Record', `${display(row.wins)}-${display(row.losses)}`)}${stat('Win rate', percent(row.win_percentage), 'fd-standing-stat--accent')}</div>
    <div class="fd-standing-row__secondary">${stat('Games', `${display(row.games_won)}-${display(row.games_lost)}`)}${stat('Diff', row.game_differential)}${stat('Prize', prizeStatus)}</div>
  </article>`;
}

export const jflModernStandingsStyles = `
  :root { --fd-standings-green: #075f3a; --fd-standings-line: #d9d7d0; --fd-standings-muted: #676c68; }
  .fd-standings, .fd-standings *, .fd-standings *::before, .fd-standings *::after { box-sizing: border-box; }
  .fd-standings { width: min(100% - 32px, 920px); margin: 0 auto; padding: 32px 0 108px; color: #171b19; }
  .fd-standings__header { display: grid; gap: 9px; margin-bottom: 22px; }
  .fd-standings__eyebrow { color: var(--fd-standings-green); font-size: .78rem; font-weight: 950; letter-spacing: .11em; text-transform: uppercase; }
  .fd-standings h1 { margin: 0; font-size: clamp(2.1rem, 8vw, 3.7rem); line-height: 1; letter-spacing: -.04em; }
  .fd-standings__lede { max-width: 58ch; margin: 0; color: var(--fd-standings-muted); line-height: 1.5; }
  .fd-standings__filters { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 12px; align-items: end; margin: 0 0 16px; padding: 14px; border: 1px solid var(--fd-standings-line); border-radius: 16px; background: #fff; }
  .fd-standings__filters label { display: grid; gap: 6px; color: var(--fd-standings-muted); font-size: .78rem; font-weight: 850; }
  .fd-standings__filters select { width: 100%; min-height: 48px; padding: 0 12px; border: 1px solid #b9b9b4; border-radius: 10px; background: #faf9f5; color: #171b19; font: inherit; }
  .fd-standings__load { min-height: 48px; padding: 0 18px; border: 0; border-radius: 10px; background: var(--fd-standings-green); color: #fff; font: inherit; font-weight: 900; cursor: pointer; }
  .fd-standings__load:disabled { cursor: not-allowed; opacity: .55; }
  .fd-standings__status { grid-column: 1 / -1; min-height: 20px; margin: 0; color: var(--fd-standings-muted); font-size: .86rem; }
  .fd-standings__status[data-tone="error"] { color: #99251d; }
  .fd-standings__tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin: 0 0 16px; padding: 4px; border: 1px solid var(--fd-standings-line); border-radius: 14px; background: #f2f1ec; }
  .fd-standings__tab { min-height: 48px; border: 0; border-radius: 10px; background: transparent; color: var(--fd-standings-green); font: inherit; font-weight: 900; cursor: pointer; }
  .fd-standings__tab[aria-selected="true"] { background: var(--fd-standings-green); color: #fff; }
  .fd-standings__panel[hidden] { display: none; }
  .fd-standings__list { display: grid; gap: 10px; }
  .fd-standing-row { display: grid; grid-template-columns: minmax(220px, 1.5fr) minmax(180px, .8fr) minmax(250px, 1fr); gap: 14px; align-items: center; padding: 15px 16px; border: 1px solid var(--fd-standings-line); border-radius: 15px; background: #fff; box-shadow: 0 3px 12px rgba(0,0,0,.035); }
  .fd-standing-row__identity { display: grid; grid-template-columns: 42px minmax(0, 1fr); gap: 11px; align-items: center; }
  .fd-standing-row__rank { width: 42px; height: 42px; display: grid; place-items: center; border-radius: 50%; background: #e8f2ed; color: var(--fd-standings-green); font-weight: 950; font-variant-numeric: tabular-nums; }
  .fd-standing-row__name { display: block; overflow-wrap: anywhere; font-size: 1.02rem; line-height: 1.2; }
  .fd-standing-row__sub { display: block; margin-top: 3px; color: var(--fd-standings-muted); font-size: .78rem; }
  .fd-standing-row__primary, .fd-standing-row__secondary { display: grid; gap: 8px; }
  .fd-standing-row__primary { grid-template-columns: 1fr 1fr; }
  .fd-standing-row__secondary { grid-template-columns: repeat(3, 1fr); }
  .fd-standing-stat { min-width: 0; }
  .fd-standing-stat span { display: block; margin-bottom: 2px; color: var(--fd-standings-muted); font-size: .68rem; font-weight: 850; letter-spacing: .02em; text-transform: uppercase; }
  .fd-standing-stat strong { display: block; overflow-wrap: anywhere; font-size: .92rem; font-variant-numeric: tabular-nums; }
  .fd-standing-stat--accent strong { color: var(--fd-standings-green); font-size: 1.05rem; }
  .fd-standings__empty, .fd-standings__state { padding: 24px 16px; border: 1px dashed var(--fd-standings-line); border-radius: 15px; color: var(--fd-standings-muted); text-align: center; line-height: 1.5; }
  .fd-standings__state { border-style: solid; background: #fff; text-align: left; }
  .fd-standings__state strong { display: block; margin-bottom: 5px; color: #171b19; }
  .fd-standings__registration { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 0 0 14px; }
  .fd-standings__registration[hidden] { display: none; }
  .fd-standings__registration div { padding: 12px; border: 1px solid var(--fd-standings-line); border-radius: 12px; background: #fff; }
  .fd-standings__registration span { display: block; color: var(--fd-standings-muted); font-size: .72rem; font-weight: 850; }
  .fd-standings__registration strong { display: block; margin-top: 3px; font-size: 1rem; }
  .fd-standings__legacy { margin: 22px 0 0; color: var(--fd-standings-muted); font-size: .82rem; }
  .fd-standings__legacy a { color: var(--fd-standings-green); }
  .fd-standings button:focus-visible, .fd-standings select:focus-visible, .fd-standings a:focus-visible { outline: 3px solid #1f7a52; outline-offset: 3px; }
  @media (max-width: 720px) {
    .fd-standings { width: min(100% - 24px, 920px); padding-top: 24px; }
    .fd-standings__filters { grid-template-columns: 1fr; }
    .fd-standings__status { grid-column: auto; }
    .fd-standings__tabs { position: sticky; top: 64px; z-index: 4; }
    .fd-standing-row { grid-template-columns: 1fr; gap: 12px; padding: 15px; }
    .fd-standing-row__primary { padding-top: 10px; border-top: 1px solid #eceae4; }
    .fd-standing-row__secondary { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .fd-standings__registration { grid-template-columns: 1fr; }
  }
  @media (max-width: 360px) {
    .fd-standing-row__secondary { grid-template-columns: 1fr 1fr; }
    .fd-standing-row__secondary .fd-standing-stat:last-child { grid-column: 1 / -1; }
  }
  @media (prefers-reduced-motion: reduce) { .fd-standings * { scroll-behavior: auto !important; transition: none !important; animation: none !important; } }
  @media (forced-colors: active) {
    .fd-standing-row, .fd-standings__filters, .fd-standings__tabs { border: 1px solid CanvasText; }
    .fd-standings__tab[aria-selected="true"], .fd-standing-row__rank { border: 2px solid Highlight; }
  }
`;

function standingsClientScript() {
  return String.raw`
    (() => {
      const seasonInput = document.querySelector('[data-standings-season]');
      const loadButton = document.querySelector('[data-standings-load]');
      const form = document.querySelector('[data-standings-form]');
      const statusEl = document.querySelector('[data-standings-status]');
      const tabs = Array.from(document.querySelectorAll('[data-standings-tab]'));
      const panels = Array.from(document.querySelectorAll('[data-standings-panel]'));
      const teamList = document.querySelector('[data-team-standings-list]');
      const playerList = document.querySelector('[data-player-standings-list]');
      const teamEmpty = document.querySelector('[data-team-standings-empty]');
      const playerEmpty = document.querySelector('[data-player-standings-empty]');
      const registration = document.querySelector('[data-registration-progress]');
      const teamCount = document.querySelector('[data-registration-team-count]');
      const playerCount = document.querySelector('[data-registration-player-count]');
      const openSlots = document.querySelector('[data-registration-open-slots]');
      const stateEl = document.querySelector('[data-standings-state]');
      const query = new URLSearchParams(location.search);
      const requestedSeasonId = query.get('season') || '';
      const rememberedSeasonId = localStorage.getItem('fd.standingsSeasonId') || '';
      const requestedView = query.get('view') || localStorage.getItem('fd.standingsView') || 'teams';
      let seasons = [];

      const esc = (value) => String(value == null ? '' : value)
        .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
      const shown = (value) => value === undefined || value === null || value === '' ? '—' : String(value);
      const percentage = (value) => {
        const number = Number(value || 0);
        return (Number.isFinite(number) ? Math.round(number * 1000) / 10 : 0) + '%';
      };
      const tiedAt = (rows, index) => {
        const rank = rows[index] && rows[index].standings_rank;
        return rank !== undefined && rank !== null && rows.filter((row) => row.standings_rank === rank).length > 1;
      };
      const rank = (row, tied) => row.standings_rank === undefined || row.standings_rank === null || row.standings_rank === '' ? '—' : (tied ? 'T-' : '') + row.standings_rank;
      const stat = (label, value, accent) => '<div class="fd-standing-stat' + (accent ? ' fd-standing-stat--accent' : '') + '"><span>' + esc(label) + '</span><strong>' + esc(shown(value)) + '</strong></div>';
      const teamCard = (row, tied) => '<article class="fd-standing-row" data-standings-rank="' + esc(row.standings_rank) + '"><div class="fd-standing-row__identity"><span class="fd-standing-row__rank" aria-label="Rank ' + esc(rank(row, tied)) + '">' + esc(rank(row, tied)) + '</span><div><strong class="fd-standing-row__name">' + esc(row.team_name || 'Unnamed team') + '</strong><span class="fd-standing-row__sub">' + esc(shown(row.games_played)) + ' of ' + esc(shown(row.maximum_matches)) + ' played</span></div></div><div class="fd-standing-row__primary">' + stat('Record', shown(row.team_wins) + '-' + shown(row.team_losses), false) + stat('Points', row.standing_points, true) + '</div><div class="fd-standing-row__secondary">' + stat('Match', shown(row.match_points) + '-' + shown(row.match_points_against), false) + stat('Diff', row.point_differential, false) + stat('Forfeit', shown(row.forfeits_won) + '-' + shown(row.forfeits_lost), false) + '</div></article>';
      const playerCard = (row, tied) => {
        const played = (Number(row.matches_played) || (Number(row.wins) + Number(row.losses))) > 0;
        const prize = played && row.is_prize_eligible ? 'Eligible #' + shown(row.prize_rank) : (played ? 'Needs ' + shown(row.minimum_matches) : 'Not yet ranked');
        return '<article class="fd-standing-row" data-standings-rank="' + esc(row.standings_rank) + '"><div class="fd-standing-row__identity"><span class="fd-standing-row__rank" aria-label="Rank ' + esc(rank(row, tied)) + '">' + esc(rank(row, tied)) + '</span><div><strong class="fd-standing-row__name">' + esc(row.display_name || 'Unnamed player') + '</strong><span class="fd-standing-row__sub">' + esc(prize) + '</span></div></div><div class="fd-standing-row__primary">' + stat('Record', shown(row.wins) + '-' + shown(row.losses), false) + stat('Win rate', percentage(row.win_percentage), true) + '</div><div class="fd-standing-row__secondary">' + stat('Games', shown(row.games_won) + '-' + shown(row.games_lost), false) + stat('Diff', row.game_differential, false) + stat('Prize', prize, false) + '</div></article>';

      function setStatus(message, tone) {
        statusEl.textContent = message;
        statusEl.dataset.tone = tone || 'muted';
      }

      function showState(message) {
        stateEl.textContent = message;
        stateEl.hidden = !message;
      }

      function selectView(view, persist = true) {
        const selected = view === 'individuals' ? 'individuals' : 'teams';
        tabs.forEach((tab) => {
          const active = tab.dataset.standingsTab === selected;
          tab.setAttribute('aria-selected', String(active));
          tab.tabIndex = active ? 0 : -1;
        });
        panels.forEach((panel) => { panel.hidden = panel.dataset.standingsPanel !== selected; });
        if (persist) {
          localStorage.setItem('fd.standingsView', selected);
          const next = new URL(location.href);
          next.searchParams.set('view', selected);
          history.replaceState(null, '', next.pathname + next.search + next.hash);
        }
      }

      function renderRegistration(season) {
        const visible = season && season.status === 'registration';
        registration.hidden = !visible;
        if (!visible) return;
        teamCount.textContent = shown(season.teamCount) + ' / ' + shown(season.teamCapacity);
        playerCount.textContent = shown(season.rosteredPlayerCount);
        openSlots.textContent = shown(season.openTeamSlots);
      }

      function renderTeams(rows) {
        const list = Array.isArray(rows) ? rows : [];
        teamList.innerHTML = list.map((row, index) => teamCard(row, tiedAt(list, index))).join('');
        teamEmpty.hidden = list.length > 0;
      }

      function renderPlayers(rows, season) {
        let list = Array.isArray(rows) ? rows.slice() : [];
        if (season && (season.status === 'registration' || season.status === 'complete')) {
          list = list.filter((row) => (Number(row.matches_played) || (Number(row.wins) + Number(row.losses))) > 0);
        }
        playerList.innerHTML = list.map((row, index) => playerCard(row, tiedAt(list, index))).join('');
        playerEmpty.hidden = list.length > 0;
      }

      function renderSeasonOptions() {
        seasonInput.replaceChildren();
        seasons.forEach((season) => {
          const option = document.createElement('option');
          option.value = season.id;
          option.textContent = season.name + ' — ' + season.status;
          seasonInput.append(option);
        });
        const selected = typeof choosePublicSeason === 'function'
          ? choosePublicSeason(seasons, { explicitId: requestedSeasonId, rememberedId: rememberedSeasonId })
          : (seasons.find((season) => season.id === requestedSeasonId)
            || seasons.find((season) => season.id === rememberedSeasonId)
            || seasons.find((season) => ['active', 'playoffs'].includes(season.status))
            || seasons.find((season) => season.status === 'registration')
            || seasons.find((season) => season.status === 'complete')
            || seasons[0]);
        seasonInput.value = selected && selected.id ? selected.id : '';
        seasonInput.disabled = seasons.length === 0;
        loadButton.disabled = seasons.length === 0;
      }

      async function loadSeasons() {
        setStatus('Loading seasons…');
        showState('');
        seasonInput.disabled = true;
        loadButton.disabled = true;
        const response = await fetch('/api/seasons');
        const body = await response.json();
        if (!response.ok) throw new Error((body && body.error) || 'Standings could not be loaded.');
        seasons = body.seasons || [];
        renderSeasonOptions();
        if (!seasons.length) {
          renderTeams([]);
          renderPlayers([], null);
          renderRegistration(null);
          teamEmpty.textContent = 'Standings will appear when a league season is published.';
          playerEmpty.textContent = 'Player standings will appear after scored matches.';
          showState('No published season yet.');
          setStatus('No standings yet');
          return false;
        }
        return true;
      }

      async function loadStandings() {
        const seasonId = String(seasonInput.value || '').trim();
        if (!seasonId) throw new Error('Choose a season first.');
        localStorage.setItem('fd.standingsSeasonId', seasonId);
        setStatus('Loading standings…');
        showState('');
        const encoded = encodeURIComponent(seasonId);
        const responses = await Promise.all([
          fetch('/api/seasons/' + encoded + '/team-standings'),
          fetch('/api/seasons/' + encoded + '/individual-standings'),
        ]);
        const teamBody = await responses[0].json();
        const playerBody = await responses[1].json();
        if (!responses[0].ok || !responses[1].ok) {
          throw new Error((teamBody && teamBody.error) || (playerBody && playerBody.error) || 'Standings could not be loaded.');
        }
        const season = seasons.find((candidate) => candidate.id === seasonId);
        renderTeams(teamBody.standings || []);
        renderPlayers(playerBody.standings || [], season);
        renderRegistration(season);
        teamEmpty.textContent = season && season.status === 'registration' ? 'Team standings begin after league play starts.' : 'No team standings are available for this season.';
        playerEmpty.textContent = season && season.status === 'registration' ? 'Player standings begin after scored matches.' : 'No individual standings are available for this season.';
        setStatus(season && season.status === 'registration' ? 'Registration progress loaded' : 'Standings loaded', 'ok');
      }

      async function run(action) {
        try {
          await action();
        } catch (error) {
          setStatus('Could not load standings', 'error');
          showState('Standings are temporarily unavailable. Nothing needs to be re-entered.');
        }
      }

      tabs.forEach((tab) => {
        tab.addEventListener('click', () => selectView(tab.dataset.standingsTab));
        tab.addEventListener('keydown', (event) => {
          if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
          event.preventDefault();
          const next = tab.dataset.standingsTab === 'teams' ? 'individuals' : 'teams';
          selectView(next);
          tabs.find((candidate) => candidate.dataset.standingsTab === next)?.focus();
        });
      });
      seasonInput.addEventListener('change', () => { if (seasonInput.value) run(loadStandings); });
      form.addEventListener('submit', (event) => { event.preventDefault(); run(loadStandings); });
      selectView(requestedView, false);
      run(async () => { if (await loadSeasons()) await loadStandings(); });
    })();
  `;
}

function standingsDocument() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Standings · Fremont Derby</title>
  <style>${jflModernStandingsStyles}</style>
</head>
<body data-fd-modern-standings="true">
  <main class="fd-standings" data-fd-modern-standings="true">
    <header class="fd-standings__header">
      <span class="fd-standings__eyebrow">League leaderboard</span>
      <h1>Standings</h1>
      <p class="fd-standings__lede">See who is leading without digging through a wide table. Team and individual results use the same official standings data as before.</p>
    </header>
    <form class="fd-standings__filters" data-standings-form>
      <label>Season<select data-standings-season disabled><option>Loading seasons…</option></select></label>
      <button class="fd-standings__load" data-standings-load type="submit" disabled>Load</button>
      <p class="fd-standings__status" data-standings-status role="status" aria-live="polite">Loading seasons…</p>
    </form>
    <div class="fd-standings__registration" data-registration-progress hidden aria-label="Registration progress">
      <div><span>Teams registered</span><strong data-registration-team-count>—</strong></div>
      <div><span>Rostered players</span><strong data-registration-player-count>—</strong></div>
      <div><span>Open team slots</span><strong data-registration-open-slots>—</strong></div>
    </div>
    <div class="fd-standings__tabs" role="tablist" aria-label="Standings views">
      <button class="fd-standings__tab" data-standings-tab="teams" role="tab" type="button" aria-selected="true" aria-controls="fd-team-standings">Team standings</button>
      <button class="fd-standings__tab" data-standings-tab="individuals" role="tab" type="button" aria-selected="false" aria-controls="fd-individual-standings">Individual standings</button>
    </div>
    <div class="fd-standings__state" data-standings-state hidden role="status" aria-live="polite"></div>
    <section class="fd-standings__panel" id="fd-team-standings" data-standings-panel="teams" role="tabpanel">
      <div class="fd-standings__list" data-team-standings-list></div>
      <div class="fd-standings__empty" data-team-standings-empty>Standings are loading.</div>
    </section>
    <section class="fd-standings__panel" id="fd-individual-standings" data-standings-panel="individuals" role="tabpanel" hidden>
      <div class="fd-standings__list" data-player-standings-list></div>
      <div class="fd-standings__empty" data-player-standings-empty>Standings are loading.</div>
    </section>
    <p class="fd-standings__legacy">JFL preview · <a href="/standings?ui=legacy">View the classic Standings body</a></p>
  </main>
  <script>${standingsClientScript()}</script>
</body>
</html>`;
}

export function renderJflModernStandings() {
  return decorateHtmlWithShell(standingsDocument(), '/standings');
}

export function routeJflModernStandings(request, env = {}) {
  if (env?.ENVIRONMENT !== 'jfl' || !request || request.method !== 'GET') return null;
  const url = new URL(request.url);
  if (url.pathname !== '/standings' || url.searchParams.get('ui') === 'legacy') return null;
  return new Response(renderJflModernStandings(), {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-fremont-ui-mode': 'modern-standings-v1',
    },
  });
}
