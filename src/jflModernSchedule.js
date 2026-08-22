import { decorateHtmlWithShell } from './appShell.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function numericTable(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
}

function roundSortKey(round = {}) {
  return [
    String(round.scheduledOn || '9999-12-31'),
    Number.isFinite(Number(round.roundNumber)) ? Number(round.roundNumber) : Number.MAX_SAFE_INTEGER,
    String(round.roundId || ''),
  ];
}

function compareKeys(left, right) {
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] < right[index]) return -1;
    if (left[index] > right[index]) return 1;
  }
  return 0;
}

export function normalizeScheduleRounds(rounds = []) {
  return (Array.isArray(rounds) ? rounds : [])
    .map((round) => ({
      ...round,
      matches: (Array.isArray(round.matches) ? round.matches : [])
        .map((match) => ({ ...match }))
        .sort((left, right) => numericTable(left.tableNumber) - numericTable(right.tableNumber)
          || String(left.teamMatchId || '').localeCompare(String(right.teamMatchId || ''))),
    }))
    .sort((left, right) => compareKeys(roundSortKey(left), roundSortKey(right)));
}

function statusLabel(value) {
  return String(value || 'scheduled').replaceAll('_', ' ');
}

function timeLabel(match = {}, round = {}) {
  const raw = match.scheduledTime || match.scheduled_time || match.startTime || match.start_time
    || round.scheduledTime || round.scheduled_time || round.startTime || round.start_time || '';
  if (!raw) return 'Time TBD';
  const matchValue = String(raw).match(/^(\d{1,2}):(\d{2})/);
  if (!matchValue) return String(raw);
  const hour = Number(matchValue[1]);
  const minute = matchValue[2];
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute} ${suffix}`;
}

function venueLabel(match = {}, round = {}) {
  return match.venueName || match.venue_name || round.venueName || round.venue_name || 'Venue TBD';
}

function scoreLabel(match = {}) {
  const left = match.teamAScore ?? match.team_a_score ?? match.scoreA ?? match.score_a;
  const right = match.teamBScore ?? match.team_b_score ?? match.scoreB ?? match.score_b;
  if (left !== undefined && left !== null && right !== undefined && right !== null) return `${left} – ${right}`;
  return ['finalized', 'corrected'].includes(String(match.status || '')) ? 'Final' : 'VS';
}

function matchIsMine(match = {}, myTeamIds = [], myTeamNames = []) {
  const ids = new Set((Array.isArray(myTeamIds) ? myTeamIds : []).filter(Boolean).map(String));
  const names = new Set((Array.isArray(myTeamNames) ? myTeamNames : []).filter(Boolean).map((name) => String(name).trim().toLowerCase()));
  return [match.teamAId, match.team_a_id, match.teamBId, match.team_b_id].some((id) => id && ids.has(String(id)))
    || [match.teamAName, match.team_a_name, match.teamBName, match.team_b_name]
      .some((name) => name && names.has(String(name).trim().toLowerCase()));
}

export function renderScheduleMatchCard(match = {}, { round = {}, myTeamIds = [], myTeamNames = [] } = {}) {
  const mine = matchIsMine(match, myTeamIds, myTeamNames);
  const matchId = String(match.teamMatchId || match.team_match_id || '');
  const teamA = escapeHtml(match.teamAName || match.team_a_name || 'Team A');
  const teamB = escapeHtml(match.teamBName || match.team_b_name || 'Team B');
  const table = match.tableNumber ?? match.table_number;
  const score = escapeHtml(scoreLabel(match));
  const state = escapeHtml(statusLabel(match.status));
  const time = escapeHtml(timeLabel(match, round));
  const venue = escapeHtml(venueLabel(match, round));
  const tableText = table === undefined || table === null || table === '' ? 'Table TBD' : `Table ${escapeHtml(table)}`;
  const encodedId = encodeURIComponent(matchId);

  return `<article class="fd-schedule-match${mine ? ' fd-schedule-match--mine' : ''}" data-my-match="${mine ? 'true' : 'false'}">
    <div class="fd-schedule-match__top">${mine ? '<strong class="fd-schedule-match__mine">Your match</strong>' : '<span class="fd-schedule-match__state">Match</span>'}<span class="fd-schedule-match__state">${state}</span></div>
    <div class="fd-schedule-match__teams"><strong>${teamA}</strong><span class="fd-schedule-match__score">${score}</span><strong>${teamB}</strong></div>
    <div class="fd-schedule-match__meta"><span>${time}</span><span>${venue}</span><span>${tableText}</span></div>
    <details class="fd-schedule-match__details"><summary>Details</summary><div class="fd-schedule-match__actions"><a href="/scorecard?match=${encodedId}">${['finalized', 'corrected'].includes(String(match.status || '')) ? 'View score' : 'Score match'}</a><a href="/messages?matchup=${encodedId}">Messages</a></div></details>
  </article>`;
}

export const jflModernScheduleStyles = `
  :root { --line: #d6d4ce; --muted: #6d706c; --green: #075f3a; --gold: #9b6c09; }
  .fd-schedule, .fd-schedule *, .fd-schedule *::before, .fd-schedule *::after { box-sizing: border-box; }
  .fd-schedule { width: min(100% - 32px, 920px); margin: 0 auto; padding: 32px 0 108px; color: #161a18; }
  .fd-schedule__header { display: grid; gap: 10px; margin-bottom: 24px; }
  .fd-schedule__eyebrow { color: var(--green); font-size: .8rem; font-weight: 900; letter-spacing: .12em; text-transform: uppercase; }
  .fd-schedule h1 { margin: 0; font-size: clamp(2.2rem, 8vw, 4rem); line-height: .98; letter-spacing: -.045em; }
  .fd-schedule__lede { max-width: 58ch; margin: 0; color: var(--muted); line-height: 1.5; }
  .fd-schedule__controls { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 16px; margin-bottom: 26px; border: 1px solid var(--line); border-radius: 18px; background: #fff; }
  .fd-schedule__controls label { display: grid; gap: 6px; color: var(--muted); font-size: .78rem; font-weight: 850; }
  .fd-schedule__controls select { width: 100%; min-height: 48px; padding: 0 12px; border: 1px solid var(--line); border-radius: 11px; background: #faf9f5; color: #161a18; font: inherit; }
  .fd-schedule__status { grid-column: 1 / -1; min-height: 20px; margin: 0; color: var(--muted); font-size: .86rem; }
  .fd-schedule__status[data-tone="error"] { color: #9d2118; }
  .fd-schedule__groups { display: grid; gap: 28px; }
  .fd-schedule-round { scroll-margin-top: 18px; }
  .fd-schedule-round__head { display: flex; align-items: end; justify-content: space-between; gap: 16px; margin: 0 2px 10px; }
  .fd-schedule-round__head h2 { margin: 0; font-size: 1.35rem; }
  .fd-schedule-round__head p { margin: 2px 0 0; color: var(--muted); font-size: .9rem; }
  .fd-schedule-round__badge { flex: 0 0 auto; padding: 6px 10px; border-radius: 999px; background: #e8f2ed; color: var(--green); font-size: .76rem; font-weight: 900; }
  .fd-schedule-round__matches { display: grid; gap: 10px; }
  .fd-schedule-match { display: grid; gap: 12px; padding: 16px; border: 1px solid var(--line); border-radius: 16px; background: #fff; box-shadow: 0 4px 14px rgba(0,0,0,.04); }
  .fd-schedule-match--mine { border-width: 2px; border-color: var(--green); }
  .fd-schedule-match__top, .fd-schedule-match__meta { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px 14px; color: var(--muted); font-size: .78rem; text-transform: capitalize; }
  .fd-schedule-match__mine { color: var(--green); text-transform: uppercase; letter-spacing: .06em; }
  .fd-schedule-match__teams { display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); align-items: center; gap: 10px; }
  .fd-schedule-match__teams strong { min-width: 0; overflow-wrap: anywhere; font-size: 1.05rem; }
  .fd-schedule-match__teams strong:last-child { text-align: right; }
  .fd-schedule-match__score { min-width: 48px; text-align: center; color: var(--green); font-weight: 950; }
  .fd-schedule-match__meta { justify-content: flex-start; padding-top: 2px; }
  .fd-schedule-match__meta span { display: inline-flex; align-items: center; min-height: 24px; }
  .fd-schedule-match__details { border-top: 1px solid #eceae4; padding-top: 8px; }
  .fd-schedule-match__details summary { min-height: 44px; display: flex; align-items: center; width: fit-content; color: var(--green); font-weight: 850; cursor: pointer; }
  .fd-schedule-match__actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding-top: 6px; }
  .fd-schedule-match__actions a { min-height: 44px; display: grid; place-items: center; padding: 8px 12px; border: 1px solid var(--line); border-radius: 10px; color: var(--green); font-weight: 850; text-decoration: none; }
  .fd-schedule__empty { padding: 28px 16px; border: 1px dashed var(--line); border-radius: 16px; color: var(--muted); text-align: center; }
  .fd-schedule__legacy { margin: 24px 0 0; color: var(--muted); font-size: .82rem; }
  .fd-schedule__legacy a { color: var(--green); }
  .fd-schedule a:focus-visible, .fd-schedule select:focus-visible, .fd-schedule summary:focus-visible { outline: 3px solid #1f7a52; outline-offset: 3px; }
  .matches[data-match-list] { display: none; }
  @media (max-width: 720px) {
    .fd-schedule { width: min(100% - 24px, 920px); padding-top: 24px; }
    .fd-schedule__controls { grid-template-columns: 1fr; padding: 14px; }
    .fd-schedule__status { grid-column: auto; }
    .fd-schedule__groups { gap: 24px; }
    .fd-schedule-round__head { align-items: flex-start; }
    .fd-schedule-match { padding: 15px; }
    .fd-schedule-match__teams { gap: 8px; }
  }
  @media (prefers-reduced-motion: reduce) { .fd-schedule * { scroll-behavior: auto !important; transition: none !important; } }
  @media (forced-colors: active) { .fd-schedule-match--mine { border: 3px solid Highlight; } .fd-schedule-match__mine { color: Highlight; } }
`;

function scheduleClientScript() {
  return String.raw`
    (() => {
      const seasonSelect = document.querySelector('[data-season-select]');
      const roundSelect = document.querySelector('[data-round-select]');
      const groups = document.querySelector('[data-schedule-groups]');
      const statusEl = document.querySelector('[data-schedule-status]');
      const emptyEl = document.querySelector('[data-schedule-empty]');
      const query = new URLSearchParams(location.search);
      const requestedSeason = query.get('season') || localStorage.getItem('fd.scheduleSeasonId') || '';
      const requestedRound = query.get('round') || localStorage.getItem('fd.scheduleRoundId') || '';
      let seasons = [];
      let rounds = [];
      let myTeamIds = new Set();
      let myTeamNames = new Set();

      const clean = (value) => String(value || '').trim();
      const token = () => sessionStorage.getItem('fd.accessToken') || '';
      const labelStatus = (value) => clean(value || 'scheduled').replaceAll('_', ' ');
      const dateLabel = (value) => {
        if (!value) return 'Date TBD';
        const date = new Date(value + 'T12:00:00');
        return Number.isNaN(date.valueOf()) ? clean(value) : new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(date);
      };
      const stageLabel = (round) => {
        if (round.stage === 'championship') return 'Championship';
        if (round.stage === 'semifinal') return 'Semifinals';
        if (round.stage === 'tiebreaker') return 'Tiebreaker';
        return 'Week ' + (round.roundNumber || '');
      };
      const timeLabel = (match, round) => {
        const raw = match.scheduledTime || match.scheduled_time || match.startTime || match.start_time || round.scheduledTime || round.scheduled_time || round.startTime || round.start_time || '';
        if (!raw) return 'Time TBD';
        const found = String(raw).match(/^(\d{1,2}):(\d{2})/);
        if (!found) return String(raw);
        const hour = Number(found[1]);
        return (hour % 12 || 12) + ':' + found[2] + ' ' + (hour >= 12 ? 'PM' : 'AM');
      };
      const venueLabel = (match, round) => match.venueName || match.venue_name || round.venueName || round.venue_name || 'Venue TBD';
      const scoreLabel = (match) => {
        const left = match.teamAScore ?? match.team_a_score ?? match.scoreA ?? match.score_a;
        const right = match.teamBScore ?? match.team_b_score ?? match.scoreB ?? match.score_b;
        if (left !== undefined && left !== null && right !== undefined && right !== null) return left + ' – ' + right;
        return ['finalized', 'corrected'].includes(String(match.status || '')) ? 'Final' : 'VS';
      };
      const tableValue = (match) => match.tableNumber ?? match.table_number;
      const teamId = (value) => clean(value);
      const teamName = (value) => clean(value).toLowerCase();
      const isMine = (match) => [match.teamAId, match.team_a_id, match.teamBId, match.team_b_id].some((id) => id && myTeamIds.has(teamId(id)))
        || [match.teamAName, match.team_a_name, match.teamBName, match.team_b_name].some((name) => name && myTeamNames.has(teamName(name)));
      const setStatus = (message, tone = 'muted') => { statusEl.textContent = message; statusEl.dataset.tone = tone; };
      async function json(response) { const text = await response.text(); if (!text) return {}; try { return JSON.parse(text); } catch { return { error: text }; } }
      async function get(path, auth = false) {
        const headers = auth && token() ? { authorization: 'Bearer ' + token() } : {};
        const response = await fetch(path, { headers });
        const body = await json(response);
        if (!response.ok) { const error = new Error(body.error || 'We could not load the schedule.'); error.status = response.status; throw error; }
        return body;
      }
      function addMeta(container, text) { const span = document.createElement('span'); span.textContent = text; container.append(span); }
      function renderMatch(match, round) {
        const mine = isMine(match);
        const card = document.createElement('article');
        card.className = 'fd-schedule-match' + (mine ? ' fd-schedule-match--mine' : '');
        card.dataset.myMatch = String(mine);
        const top = document.createElement('div'); top.className = 'fd-schedule-match__top';
        const flag = document.createElement(mine ? 'strong' : 'span'); flag.className = mine ? 'fd-schedule-match__mine' : 'fd-schedule-match__state'; flag.textContent = mine ? 'Your match' : 'Match';
        const state = document.createElement('span'); state.className = 'fd-schedule-match__state'; state.textContent = labelStatus(match.status);
        top.append(flag, state);
        const teams = document.createElement('div'); teams.className = 'fd-schedule-match__teams';
        const left = document.createElement('strong'); left.textContent = match.teamAName || match.team_a_name || 'Team A';
        const score = document.createElement('span'); score.className = 'fd-schedule-match__score'; score.textContent = scoreLabel(match);
        const right = document.createElement('strong'); right.textContent = match.teamBName || match.team_b_name || 'Team B'; teams.append(left, score, right);
        const meta = document.createElement('div'); meta.className = 'fd-schedule-match__meta'; addMeta(meta, timeLabel(match, round)); addMeta(meta, venueLabel(match, round)); const table = tableValue(match); addMeta(meta, table === undefined || table === null || table === '' ? 'Table TBD' : 'Table ' + table);
        const details = document.createElement('details'); details.className = 'fd-schedule-match__details';
        const summary = document.createElement('summary'); summary.textContent = 'Details';
        const actions = document.createElement('div'); actions.className = 'fd-schedule-match__actions';
        const id = clean(match.teamMatchId || match.team_match_id);
        const scoreLink = document.createElement('a'); scoreLink.href = '/scorecard?match=' + encodeURIComponent(id); scoreLink.textContent = ['finalized', 'corrected'].includes(String(match.status || '')) ? 'View score' : 'Score match';
        const messages = document.createElement('a'); messages.href = '/messages?matchup=' + encodeURIComponent(id); messages.textContent = 'Messages';
        actions.append(scoreLink, messages); details.append(summary, actions); card.append(top, teams, meta, details); return card;
      }
      function sortRounds(items) {
        return [...items].map((round) => ({ ...round, matches: [...(round.matches || [])].sort((a, b) => Number(a.tableNumber ?? a.table_number ?? 9999) - Number(b.tableNumber ?? b.table_number ?? 9999) || clean(a.teamMatchId).localeCompare(clean(b.teamMatchId))) }))
          .sort((a, b) => clean(a.scheduledOn || '9999-12-31').localeCompare(clean(b.scheduledOn || '9999-12-31')) || Number(a.roundNumber || 9999) - Number(b.roundNumber || 9999) || clean(a.roundId).localeCompare(clean(b.roundId)));
      }
      function preferredRoundId() {
        if (requestedRound && rounds.some((round) => round.roundId === requestedRound)) return requestedRound;
        const today = new Date().toISOString().slice(0, 10);
        const live = rounds.find((round) => (round.matches || []).some((match) => match.status === 'in_progress'));
        if (live) return live.roundId;
        return (rounds.find((round) => !round.scheduledOn || round.scheduledOn >= today) || rounds[rounds.length - 1] || {}).roundId || '';
      }
      function renderRoundSelect() {
        roundSelect.replaceChildren();
        for (const round of rounds) { const option = document.createElement('option'); option.value = round.roundId; option.textContent = stageLabel(round) + ' · ' + dateLabel(round.scheduledOn); roundSelect.append(option); }
        roundSelect.disabled = rounds.length === 0;
        roundSelect.value = preferredRoundId();
      }
      function renderGroups() {
        groups.replaceChildren(); emptyEl.hidden = rounds.length > 0;
        const today = new Date().toISOString().slice(0, 10);
        for (const round of rounds) {
          const section = document.createElement('section'); section.className = 'fd-schedule-round'; section.dataset.roundId = round.roundId;
          const head = document.createElement('div'); head.className = 'fd-schedule-round__head';
          const copy = document.createElement('div'); const title = document.createElement('h2'); title.textContent = stageLabel(round); const date = document.createElement('p'); date.textContent = dateLabel(round.scheduledOn); copy.append(title, date);
          const badge = document.createElement('span'); badge.className = 'fd-schedule-round__badge'; badge.textContent = round.scheduledOn === today ? 'Tonight' : labelStatus(round.status || 'scheduled'); head.append(copy, badge);
          const list = document.createElement('div'); list.className = 'fd-schedule-round__matches';
          for (const match of round.matches || []) list.append(renderMatch(match, round));
          if (!(round.matches || []).length) { const none = document.createElement('div'); none.className = 'fd-schedule__empty'; none.textContent = 'No matchups are posted for this league night.'; list.append(none); }
          section.append(head, list); groups.append(section);
        }
      }
      function saveSelection() {
        if (!roundSelect.value) return;
        localStorage.setItem('fd.scheduleRoundId', roundSelect.value);
        const url = new URL(location.href); url.searchParams.set('season', seasonSelect.value); url.searchParams.set('round', roundSelect.value); history.replaceState({}, '', url);
      }
      function focusRound({ scroll = false } = {}) {
        saveSelection();
        const section = [...groups.querySelectorAll('[data-round-id]')].find((item) => item.dataset.roundId === roundSelect.value);
        if (section && scroll) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      async function loadMyTeams() {
        myTeamIds = new Set(); myTeamNames = new Set();
        if (!token()) return;
        try {
          const body = await get('/api/me/teams', true);
          const management = body.teamManagement || {};
          const candidates = [...(management.availability_contexts || []), ...(management.captain_teams || [])];
          for (const item of candidates) {
            const id = item.teamId || item.team_id || item.id; const name = item.teamName || item.team_name || item.name;
            if (id) myTeamIds.add(teamId(id)); if (name) myTeamNames.add(teamName(name));
          }
        } catch { /* Schedule remains public if personal context is unavailable. */ }
      }
      function renderSeasons() {
        seasonSelect.replaceChildren();
        if (!seasons.length) { const option = document.createElement('option'); option.textContent = 'No public seasons'; option.value = ''; seasonSelect.append(option); seasonSelect.disabled = true; return; }
        for (const season of seasons) { const option = document.createElement('option'); option.value = season.id; option.textContent = season.name + ' · ' + labelStatus(season.status); seasonSelect.append(option); }
        const current = seasons.find((season) => ['active', 'playoffs'].includes(season.status)) || seasons[0];
        seasonSelect.value = requestedSeason && seasons.some((season) => season.id === requestedSeason) ? requestedSeason : current.id; seasonSelect.disabled = false;
      }
      async function loadSchedule() {
        if (!seasonSelect.value) return;
        setStatus('Loading schedule…');
        const [body] = await Promise.all([get('/api/seasons/' + encodeURIComponent(seasonSelect.value) + '/schedule'), loadMyTeams()]);
        rounds = sortRounds(body.rounds || []); localStorage.setItem('fd.scheduleSeasonId', seasonSelect.value); renderRoundSelect(); renderGroups(); focusRound(); setStatus(rounds.length ? 'Schedule ready' : 'Schedule not published', rounds.length ? 'ok' : 'muted');
      }
      async function bootstrap() { const body = await get('/api/seasons'); seasons = body.seasons || []; renderSeasons(); if (seasonSelect.value) await loadSchedule(); else { emptyEl.hidden = false; setStatus('No public seasons'); } }
      seasonSelect.addEventListener('change', () => loadSchedule().catch((error) => setStatus(error.message, 'error')));
      roundSelect.addEventListener('change', () => focusRound({ scroll: true }));
      bootstrap().catch((error) => { groups.replaceChildren(); emptyEl.hidden = false; setStatus(error.message || 'We could not load the schedule.', 'error'); });
    })();
  `;
}

function scheduleDocument() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Schedule · Fremont Derby</title>
  <style>${jflModernScheduleStyles}</style>
</head>
<body>
  <main class="fd-schedule" data-fd-modern-schedule="true">
    <header class="fd-schedule__header">
      <span class="fd-schedule__eyebrow">Fremont Derby</span>
      <h1>Schedule</h1>
      <p class="fd-schedule__lede">Scan league nights quickly. Your match stands out when you are signed in, while time, venue, table, and result stay visible without opening anything.</p>
    </header>
    <section class="fd-schedule__controls" aria-label="Schedule selection">
      <label>Season<select data-season-select disabled><option value="">Loading seasons…</option></select></label>
      <label>League night<select data-round-select disabled><option value="">Loading schedule…</option></select></label>
      <p class="fd-schedule__status" data-schedule-status role="status" aria-live="polite">Loading schedule…</p>
      <div class="matches" data-match-list></div>
    </section>
    <div class="fd-schedule__groups" data-schedule-groups></div>
    <div class="fd-schedule__empty" data-schedule-empty hidden>No schedule has been published for this season yet.</div>
    <p class="fd-schedule__legacy">JFL preview · <a href="/schedule?ui=legacy">View the classic Schedule body</a></p>
  </main>
  <script>${scheduleClientScript()}</script>
</body>
</html>`;
}

export function renderJflModernSchedule() {
  return decorateHtmlWithShell(scheduleDocument(), '/schedule');
}

export function routeJflModernSchedule(request, env = {}) {
  if (env?.ENVIRONMENT !== 'jfl' || !request || request.method !== 'GET') return null;
  const url = new URL(request.url);
  if (url.pathname !== '/schedule' || url.searchParams.get('ui') === 'legacy') return null;
  return new Response(renderJflModernSchedule(), {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-fremont-ui-mode': 'modern-schedule-v1',
    },
  });
}
