import { decorateHtmlWithShell } from './appShell.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function teamInitials(name) {
  const words = String(name || 'Team').trim().split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((word) => word[0]).join('').toUpperCase() || 'T';
}

const activeTeamApplicationStatuses = new Set([
  'applied',
  'deferred',
  'approved_pending_roster',
  'ready',
  'confirmed',
]);

export function availableTeamApplicationSeasons(seasons = [], registrations = []) {
  const unavailableSeasonIds = new Set(
    registrations
      .filter((registration) => (registration?.applications || [])
        .some((application) => activeTeamApplicationStatuses.has(application?.status)))
      .map((registration) => String(registration?.seasonId || ''))
      .filter(Boolean),
  );
  return seasons.filter((season) => season?.status === 'registration'
    && !unavailableSeasonIds.has(String(season.id || '')));
}

export function friendlyTeamsError(message) {
  const raw = String(message || '').trim();
  if (/already have a team application/i.test(raw)) {
    return 'You already have a team application for this season.';
  }
  if (/already has an active team membership/i.test(raw)) {
    return 'Already rostered for this season. Choose someone else.';
  }
  return raw.replace(/^Supabase request failed with \d+:\s*/i, '')
    || 'We could not update teams.';
}

export function availableInvitationPlayers(team = {}, players = []) {
  const seasonId = String(team.seasonId || '').trim();
  const excludedPlayerIds = new Set([
    ...(Array.isArray(team.roster) ? team.roster : []),
    ...(Array.isArray(team.pendingInvitations) ? team.pendingInvitations : []),
  ].map((entry) => String(entry?.playerId || '').trim()).filter(Boolean));

  return (Array.isArray(players) ? players : []).filter((player) => {
    const playerId = String(player?.id || '').trim();
    if (!playerId || excludedPlayerIds.has(playerId)) return false;
    const activeSeasonIds = Array.isArray(player?.activeSeasonIds)
      ? player.activeSeasonIds.map((id) => String(id || '').trim())
      : [];
    return !seasonId || !activeSeasonIds.includes(seasonId);
  });
}

export function visibleTeamActions(team = {}) {
  if (team.relationship === 'captain') return ['message'];
  if (team.relationship === 'member') return ['message'];
  if (team.relationship === 'pending') return ['cancel'];
  if (team.relationship === 'none') return ['join'];
  return [];
}

export function normalizeTeamCards(management = {}, requests = {}) {
  const cards = [];
  const byId = new Set();

  for (const team of Array.isArray(management.captain_teams) ? management.captain_teams : []) {
    const roster = Array.isArray(team.roster) ? team.roster : [];
    const captain = roster.find((member) => member.role === 'captain');
    const teamId = String(team.teamId || '');
    if (!teamId || byId.has(teamId)) continue;
    byId.add(teamId);
    cards.push({
      ...team,
      teamId,
      relationship: 'captain',
      isMine: true,
      captainName: captain?.displayName || 'You',
      roster,
      rosterCount: roster.length,
    });
  }

  const directoryById = new Map();
  for (const team of Array.isArray(requests.league_teams) ? requests.league_teams : []) {
    if (team?.teamId) directoryById.set(String(team.teamId), { ...team, relationship: 'directory' });
  }
  for (const team of Array.isArray(requests.joinable_teams) ? requests.joinable_teams : []) {
    if (!team?.teamId) continue;
    const relationship = team.hasActiveMembership
      ? 'member'
      : (team.pendingRequestId ? 'pending' : 'none');
    directoryById.set(String(team.teamId), {
      ...(directoryById.get(String(team.teamId)) || {}),
      ...team,
      relationship,
    });
  }
  const remaining = [...directoryById.values()]
    .filter((team) => team?.teamId && !byId.has(String(team.teamId)))
    .map((team) => {
      const relationship = team.relationship || 'directory';
      return {
        ...team,
        teamId: String(team.teamId),
        relationship,
        isMine: relationship === 'member',
        captainName: team.captainName || '',
        roster: Array.isArray(team.roster) ? team.roster : [],
        rosterCount: Number.isFinite(Number(team.rosterCount))
          ? Number(team.rosterCount)
          : (Array.isArray(team.roster) ? team.roster.length : null),
      };
    })
    .sort((left, right) => Number(right.isMine) - Number(left.isMine)
      || String(left.seasonName || '').localeCompare(String(right.seasonName || ''))
      || String(left.teamName || '').localeCompare(String(right.teamName || '')));

  return cards.concat(remaining);
}

function rosterMarkup(team) {
  if (!Array.isArray(team.roster) || team.roster.length === 0) {
    return '<p class="fd-team-card__empty">Roster details are available to team members and captains.</p>';
  }
  return `<ul class="fd-team-card__roster">${team.roster.map((member) => `<li><span class="fd-team-card__roster-name">${escapeHtml(member.displayName || 'Player')}</span><strong>${member.role === 'captain' ? 'Captain' : 'Player'}</strong></li>`).join('')}</ul>`;
}

export function renderTeamCard(team = {}) {
  const actions = visibleTeamActions(team);
  const mine = Boolean(team.isMine);
  const captain = team.captainName || (mine ? 'Captain details in roster' : 'Captain not assigned');
  const rosterCount = team.rosterCount === null || team.rosterCount === undefined
    ? 'Roster details'
    : `${team.rosterCount} player${Number(team.rosterCount) === 1 ? '' : 's'}`;
  const relationship = team.relationship === 'captain'
    ? '<span class="fd-team-card__relationship">My team · Captain</span>'
    : (team.relationship === 'member'
      ? '<span class="fd-team-card__relationship">My team · Player</span>'
      : (team.relationship === 'pending'
        ? '<span class="fd-team-card__pending">Request pending</span>'
        : (team.relationship === 'directory' ? '<span class="fd-team-card__directory">League team</span>' : '')));
  const buttons = actions.map((action) => {
    if (action === 'manage') return '<button type="button" data-team-action="manage">Manage roster</button>';
    if (action === 'roster') return '<button type="button" data-team-action="roster">View roster</button>';
    if (action === 'message') return `<a href="/messages?team=${encodeURIComponent(team.teamId || '')}">Team messages</a>`;
    if (action === 'cancel') return '<button type="button" class="fd-team-button--quiet" data-team-action="cancel">Cancel request</button>';
    return '<button type="button" data-team-action="join">Request to join</button>';
  }).join('');

  const rosterDetails = ['captain', 'member'].includes(team.relationship)
    ? `<details class="fd-team-card__details"><summary>${team.relationship === 'captain' ? 'Manage roster' : 'View roster'}</summary>${rosterMarkup(team)}</details>`
    : '';

  return `<article class="fd-team-card${mine ? ' fd-team-card--mine' : ''}" data-team-card data-relationship="${escapeHtml(team.relationship || 'none')}" data-team-id="${escapeHtml(team.teamId || '')}">
    <div class="fd-team-card__head">
      <span class="fd-team-card__mark" aria-hidden="true">${escapeHtml(teamInitials(team.teamName))}</span>
      <div class="fd-team-card__identity"><div>${relationship}</div><h2>${escapeHtml(team.teamName || 'Unnamed team')}</h2><p>${escapeHtml(team.seasonName || 'Season')}</p></div>
    </div>
    <div class="fd-team-card__facts"><span><small>Captain</small><strong>${escapeHtml(captain)}</strong></span><span><small>Roster</small><strong>${escapeHtml(rosterCount)}</strong></span></div>
    ${rosterDetails}
    <div class="fd-team-card__actions">${buttons}</div>
  </article>`;
}

export const jflModernTeamsStyles = `
  :root { --fd-teams-green: #075f3a; --fd-teams-green-dark: #04452a; --fd-teams-line: #d6d4ce; --fd-teams-muted: #666b67; }
  .fd-teams, .fd-teams *, .fd-teams *::before, .fd-teams *::after { box-sizing: border-box; }
  .fd-teams { width: min(100% - 32px, 920px); margin: 0 auto; padding: 32px 0 108px; color: #171b19; }
  .fd-teams [hidden] { display: none !important; }
  .fd-teams__header { display: grid; gap: 10px; margin-bottom: 22px; }
  .fd-teams__eyebrow { color: var(--fd-teams-green); font-size: .8rem; font-weight: 900; letter-spacing: .12em; text-transform: uppercase; }
  .fd-teams h1 { margin: 0; font-size: clamp(2.25rem, 8vw, 4rem); line-height: .98; letter-spacing: -.045em; }
  .fd-teams__lede { max-width: 60ch; margin: 0; color: var(--fd-teams-muted); line-height: 1.5; }
  .fd-teams__toolbar { display: grid; gap: 12px; padding: 15px; border: 1px solid var(--fd-teams-line); border-radius: 18px; background: #fff; }
  .fd-teams__toolbar-top { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 10px; align-items: end; }
  .fd-teams__toolbar label { display: grid; gap: 6px; color: var(--fd-teams-muted); font-size: .78rem; font-weight: 850; }
  .fd-teams__toolbar input, .fd-teams__toolbar select { min-height: 48px; width: 100%; padding: 0 12px; border: 1px solid var(--fd-teams-line); border-radius: 11px; background: #faf9f5; color: #171b19; font: inherit; }
  .fd-teams__filters { display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px; padding: 6px; border: 1px solid var(--fd-teams-line); border-radius: 14px; background: #f1f0eb; }
  .fd-teams__filters button { min-height: 44px; border: 2px solid transparent; border-radius: 10px; background: transparent; color: #315041; font: inherit; font-weight: 900; }
  .fd-teams__filters button[aria-pressed="true"] { border-color: var(--fd-teams-green-dark); background: var(--fd-teams-green-dark); color: #fff; box-shadow: 0 2px 7px rgba(4,69,42,.3); }
  .fd-teams__status { min-height: 22px; margin: 0; color: var(--fd-teams-muted); font-size: .86rem; }
  .fd-teams__status[data-tone="error"] { color: #9d2118; }
  .fd-teams__status[data-tone="ok"] { color: var(--fd-teams-green); }
  .fd-teams__state { margin-top: 18px; padding: 28px 18px; border: 1px dashed var(--fd-teams-line); border-radius: 16px; color: var(--fd-teams-muted); text-align: center; }
  .fd-teams__state strong { display: block; margin-bottom: 6px; color: #171b19; font-size: 1.05rem; }
  .fd-teams__state a, .fd-teams__state button { min-height: 44px; display: inline-flex; align-items: center; justify-content: center; margin-top: 12px; padding: 0 16px; border: 1px solid var(--fd-teams-green); border-radius: 10px; background: var(--fd-teams-green); color: #fff; font: inherit; font-weight: 900; text-decoration: none; }
  .fd-teams__section { margin-top: 28px; }
  .fd-teams__section-head { display: flex; align-items: baseline; justify-content: space-between; gap: 14px; margin: 0 2px 10px; }
  .fd-teams__section-head h2 { margin: 0; font-size: 1.25rem; }
  .fd-teams__section-head span { color: var(--fd-teams-muted); font-size: .8rem; }
  .fd-teams__cards { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  .fd-team-card { min-width: 0; display: grid; align-content: start; gap: 14px; padding: 16px; border: 1px solid var(--fd-teams-line); border-radius: 17px; background: #fff; box-shadow: 0 4px 14px rgba(0,0,0,.04); }
  .fd-team-card--mine { border: 3px solid var(--fd-teams-green); padding: 14px; background: linear-gradient(145deg, #f0f8f3, #fff 62%); box-shadow: 0 7px 18px rgba(7,95,58,.14); }
  .fd-team-card__head { display: grid; grid-template-columns: 50px minmax(0, 1fr); gap: 12px; align-items: center; }
  .fd-team-card__mark { width: 50px; height: 50px; display: grid; place-items: center; border-radius: 14px; background: #e8f2ed; color: var(--fd-teams-green); font-weight: 950; }
  .fd-team-card--mine .fd-team-card__mark { background: var(--fd-teams-green); color: #fff; }
  .fd-team-card__identity { min-width: 0; }
  .fd-team-card__identity > div { min-height: 20px; }
  .fd-team-card__identity h2 { margin: 1px 0 2px; overflow-wrap: anywhere; font-size: 1.12rem; }
  .fd-team-card__identity p { margin: 0; color: var(--fd-teams-muted); font-size: .8rem; }
  .fd-team-card__relationship, .fd-team-card__pending, .fd-team-card__directory { display: inline-flex; min-height: 22px; align-items: center; padding: 2px 8px; border-radius: 999px; font-size: .68rem; font-weight: 950; text-transform: uppercase; letter-spacing: .04em; }
  .fd-team-card__relationship { background: var(--fd-teams-green-dark); color: #fff; }
  .fd-team-card__pending { background: #fff1c9; color: #6b4a00; }
  .fd-team-card__directory { background: #eceae4; color: #38433d; }
  .fd-team-card__facts { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .fd-team-card__facts span { min-width: 0; padding: 10px; border-radius: 11px; background: #f5f4ef; }
  .fd-team-card__facts small { display: block; color: var(--fd-teams-muted); font-size: .68rem; font-weight: 850; text-transform: uppercase; }
  .fd-team-card__facts strong { display: block; margin-top: 3px; overflow-wrap: anywhere; font-size: .88rem; }
  .fd-team-card__details { border-top: 1px solid #eceae4; }
  .fd-team-card__details summary { min-height: 44px; display: flex; align-items: center; padding: 0 12px; color: var(--fd-teams-green); font-weight: 900; cursor: pointer; }
  .fd-team-card__roster { display: grid; gap: 0; margin: 0; padding: 0; list-style: none; }
  .fd-team-card__roster li { min-height: 42px; display: grid; grid-template-columns: minmax(0, 1fr) auto auto; align-items: center; gap: 8px 10px; padding: 7px 0; border-top: 1px solid #eceae4; }
  .fd-team-card__roster-name { min-width: 0; overflow-wrap: anywhere; }
  .fd-team-card__roster strong { color: var(--fd-teams-muted); font-size: .72rem; text-transform: uppercase; }
  .fd-team-card__roster-action { min-width: 0; }
  .fd-team-card__empty { margin: 0; padding: 8px 0; color: var(--fd-teams-muted); font-size: .82rem; }
  .fd-team-card__captain-tools { display: grid; gap: 10px; padding-top: 10px; }
  .fd-team-card__invite { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px; }
  .fd-team-card__invite select { min-height: 44px; min-width: 0; border: 1px solid var(--fd-teams-line); border-radius: 10px; background: #fff; font: inherit; }
  .fd-team-card__actions { display: flex; flex-wrap: wrap; gap: 8px; }
  .fd-team-card__actions button, .fd-team-card__actions a, .fd-team-card__invite button, .fd-team-card__roster-action, .fd-team-request button, .fd-team-invitation button, .fd-team-formation button { min-height: 44px; display: inline-flex; align-items: center; justify-content: center; padding: 7px 13px; border: 1px solid var(--fd-teams-green); border-radius: 10px; background: var(--fd-teams-green); color: #fff; font: inherit; font-weight: 900; text-decoration: none; }
  .fd-team-card__actions .fd-team-button--quiet, .fd-team-card__roster-action, .fd-team-request button:last-child, .fd-team-invitation button:last-child { border-color: var(--fd-teams-line); background: #fff; color: #38433d; }
  .fd-team-card__invite button:disabled, .fd-team-card__invite select:disabled { cursor: not-allowed; opacity: .62; }
  .fd-teams__inbox { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 28px; }
  .fd-teams__panel { padding: 16px; border: 1px solid var(--fd-teams-line); border-radius: 17px; background: #fff; }
  .fd-teams__panel h2 { margin: 0 0 10px; font-size: 1rem; }
  .fd-team-request, .fd-team-invitation, .fd-team-formation { display: grid; gap: 8px; padding: 12px 0; border-top: 1px solid #eceae4; }
  .fd-team-request:first-of-type, .fd-team-invitation:first-of-type, .fd-team-formation:first-of-type { border-top: 0; }
  .fd-team-request p, .fd-team-invitation p, .fd-team-formation p { margin: 0; color: var(--fd-teams-muted); font-size: .82rem; }
  .fd-team-request div, .fd-team-invitation div { display: flex; flex-wrap: wrap; gap: 8px; }
  .fd-teams__formation { margin-top: 28px; }
  .fd-teams__formation > summary { min-height: 52px; display: flex; align-items: center; padding: 0 16px; border: 1px solid var(--fd-teams-line); border-radius: 14px; background: #fff; color: var(--fd-teams-green); font-weight: 900; cursor: pointer; }
  .fd-teams__formation[open] > summary { border-radius: 14px 14px 0 0; }
  .fd-teams__formation-body { display: grid; gap: 14px; padding: 16px; border: 1px solid var(--fd-teams-line); border-top: 0; border-radius: 0 0 14px 14px; background: #fff; }
  .fd-teams__formation-copy { margin: 0; color: var(--fd-teams-muted); font-size: .84rem; line-height: 1.45; }
  .fd-teams__formation-form { display: grid; grid-template-columns: 1fr 1fr auto; gap: 10px; align-items: end; }
  .fd-teams__formation-form label { display: grid; gap: 6px; color: var(--fd-teams-muted); font-size: .78rem; font-weight: 850; }
  .fd-teams__formation-form select, .fd-teams__formation-form input { width: 100%; min-height: 48px; padding: 0 12px; border: 1px solid var(--fd-teams-line); border-radius: 10px; background: #faf9f5; font: inherit; }
  .fd-teams__formation-form button { min-height: 48px; padding: 0 16px; border: 1px solid var(--fd-teams-green); border-radius: 10px; background: var(--fd-teams-green); color: #fff; font: inherit; font-weight: 900; }
  .fd-teams__formation-form [data-team-formation-help] { grid-column: 1 / -1; }
  .fd-teams__legacy { margin: 22px 0 0; color: var(--fd-teams-muted); font-size: .82rem; }
  .fd-teams__legacy a { color: var(--fd-teams-green); }
  .fd-teams button:focus-visible, .fd-teams a:focus-visible, .fd-teams input:focus-visible, .fd-teams select:focus-visible, .fd-teams summary:focus-visible { outline: 3px solid #1f7a52; outline-offset: 3px; }
  @media (max-width: 720px) {
    .fd-teams { width: min(100% - 24px, 920px); padding: 24px 0 calc(172px + env(safe-area-inset-bottom)); }
    .fd-teams__toolbar-top, .fd-teams__cards, .fd-teams__inbox, .fd-teams__formation-form { grid-template-columns: 1fr; }
    .fd-team-card { padding: 15px; }
    .fd-team-card--mine { padding: 13px; }
    .fd-team-card__actions { display: grid; grid-template-columns: 1fr; }
    .fd-team-card__actions > * { width: 100%; }
  }
  @media (max-width: 520px) {
    .fd-team-card__invite { grid-template-columns: 1fr; }
    .fd-team-card__invite button { width: 100%; }
    .fd-team-card__roster li { grid-template-columns: minmax(0, 1fr) auto; }
    .fd-team-card__roster-action { grid-column: 1 / -1; width: 100%; }
  }
  @media (max-width: 380px) { .fd-team-card__facts, .fd-teams__filters, .fd-team-card__invite { grid-template-columns: 1fr; } }
  @media (prefers-reduced-motion: reduce) { .fd-teams * { scroll-behavior: auto !important; transition: none !important; animation: none !important; } }
  @media (forced-colors: active) { .fd-team-card, .fd-teams__toolbar, .fd-teams__filters { border: 1px solid CanvasText; } .fd-team-card--mine, .fd-teams__filters button[aria-pressed="true"] { border: 3px solid Highlight; } }
`;

function teamsClientScript() {
  return String.raw`
    (() => {
      const statusEl = document.querySelector('[data-teams-status]');
      const stateEl = document.querySelector('[data-teams-state]');
      const contentEl = document.querySelector('[data-teams-content]');
      const mineSection = document.querySelector('[data-my-teams-section]');
      const mineList = document.querySelector('[data-my-team-list]');
      const directorySection = document.querySelector('[data-team-directory-section]');
      const directoryList = document.querySelector('[data-team-directory]');
      const directoryEmpty = document.querySelector('[data-team-directory-empty]');
      const searchInput = document.querySelector('[data-team-search]');
      const filters = Array.from(document.querySelectorAll('[data-team-filter]'));
      const invitationsEl = document.querySelector('[data-team-invitations]');
      const requestsEl = document.querySelector('[data-captain-requests]');
      const inboxEl = document.querySelector('[data-teams-inbox]');
      const formationForm = document.querySelector('[data-team-formation-form]');
      const seasonSelect = document.querySelector('[data-team-season]');
      const teamNameInput = document.querySelector('[data-team-name]');
      const formationItems = document.querySelector('[data-team-formation-items]');
      let management = {};
      let requestData = {};
      let cards = [];
      let registrations = [];
      let filter = 'all';

      const token = () => sessionStorage.getItem('fd.accessToken') || '';
      const clean = (value) => String(value == null ? '' : value).trim();
      const initials = (name) => clean(name || 'Team').split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join('').toUpperCase() || 'T';
      const setStatus = (message, tone = 'muted') => { statusEl.textContent = message; statusEl.dataset.tone = tone; };
      const activeApplicationStatuses = new Set(['applied', 'deferred', 'approved_pending_roster', 'ready', 'confirmed']);
      const friendlyError = (message) => {
        const raw = clean(message);
        if (/already have a team application/i.test(raw)) return 'You already have a team application for this season.';
        if (/already has an active team membership/i.test(raw)) return 'Already rostered for this season. Choose someone else.';
        return raw.replace(/^Supabase request failed with \d+:\s*/i, '') || 'We could not update teams.';
      };
      async function json(response) { const text = await response.text(); if (!text) return {}; try { return JSON.parse(text); } catch { return { error: text }; } }
      async function api(path, options = {}) {
        if (!token()) { const error = new Error('Sign in to manage teams.'); error.status = 401; throw error; }
        const response = await fetch(path, { ...options, headers: { authorization: 'Bearer ' + token(), 'content-type': 'application/json', ...(options.headers || {}) } });
        const body = await json(response);
        if (!response.ok) { const error = new Error(friendlyError(body.error)); error.status = response.status; throw error; }
        return body;
      }
      function relationActions(team) {
        if (team.relationship === 'captain') return ['message'];
        if (team.relationship === 'member') return ['message'];
        if (team.relationship === 'pending') return ['cancel'];
        if (team.relationship === 'none') return ['join'];
        return [];
      }
      function normalize() {
        const result = [];
        const seen = new Set();
        for (const team of management.captain_teams || []) {
          const id = clean(team.teamId); if (!id || seen.has(id)) continue; seen.add(id);
          const roster = Array.isArray(team.roster) ? team.roster : [];
          const captain = roster.find((member) => member.role === 'captain');
          result.push({ ...team, teamId: id, relationship: 'captain', isMine: true, captainName: captain && captain.displayName || 'You', roster, rosterCount: roster.length });
        }
        const directory = new Map();
        for (const team of requestData.league_teams || []) { if (team.teamId) directory.set(clean(team.teamId), { ...team, relationship: 'directory' }); }
        for (const team of requestData.joinable_teams || []) {
          if (!team.teamId) continue;
          const relationship = team.hasActiveMembership ? 'member' : (team.pendingRequestId ? 'pending' : 'none');
          directory.set(clean(team.teamId), { ...(directory.get(clean(team.teamId)) || {}), ...team, relationship });
        }
        const rest = [...directory.values()].filter((team) => team.teamId && !seen.has(clean(team.teamId))).map((team) => {
          const relationship = team.relationship || 'directory';
          return { ...team, teamId: clean(team.teamId), relationship, isMine: relationship === 'member', roster: team.roster || [], rosterCount: team.rosterCount == null ? null : Number(team.rosterCount), captainName: team.captainName || '' };
        }).sort((a, b) => Number(b.isMine) - Number(a.isMine) || clean(a.teamName).localeCompare(clean(b.teamName)));
        return result.concat(rest);
      }
      function node(tag, className, text) { const el = document.createElement(tag); if (className) el.className = className; if (text != null) el.textContent = text; return el; }
      function button(label, action, id, quiet = false) { const el = node('button', quiet ? 'fd-team-button--quiet' : '', label); el.type = 'button'; el.dataset.teamAction = action; if (id) el.dataset.actionId = id; return el; }
      function renderRoster(team, target) {
        target.replaceChildren();
        const roster = Array.isArray(team.roster) ? team.roster : [];
        if (!roster.length) { target.append(node('p', 'fd-team-card__empty', 'Roster details are available to team members and captains.')); return; }
        const list = node('ul', 'fd-team-card__roster');
        for (const member of roster) {
          const item = document.createElement('li'); item.append(node('span', 'fd-team-card__roster-name', member.displayName || 'Player'), node('strong', '', member.role === 'captain' ? 'Captain' : 'Player'));
          if (team.relationship === 'captain' && member.role !== 'captain' && member.membershipId) { const remove = button('Remove', 'remove', member.membershipId, true); remove.classList.add('fd-team-card__roster-action'); item.append(remove); }
          list.append(item);
        }
        target.append(list);
        if (team.relationship === 'captain') {
          const tools = node('div', 'fd-team-card__captain-tools');
          const invite = node('div', 'fd-team-card__invite');
          const select = document.createElement('select'); select.setAttribute('aria-label', 'Player to invite'); select.dataset.inviteSelect = team.teamId;
          const placeholder = document.createElement('option'); placeholder.value = ''; placeholder.textContent = 'Invite a player…'; select.append(placeholder);
          const excluded = new Set([...roster, ...(team.pendingInvitations || [])].map((entry) => clean(entry.playerId)).filter(Boolean));
          const candidates = (management.players || []).filter((player) => !excluded.has(clean(player.id)) && !(player.activeSeasonIds || []).map(clean).includes(clean(team.seasonId)));
          for (const player of candidates) { const option = document.createElement('option'); option.value = player.id; option.textContent = player.display_name; select.append(option); }
          const send = button('Send invite', 'invite', team.teamId);
          if (!candidates.length) { placeholder.textContent = 'No eligible players available'; select.disabled = true; send.disabled = true; }
          invite.append(select, send); tools.append(invite); target.append(tools);
        }
      }
      function renderCard(team) {
        const article = node('article', 'fd-team-card' + (team.isMine ? ' fd-team-card--mine' : ''));
        article.dataset.teamCard = ''; article.dataset.teamId = team.teamId; article.dataset.relationship = team.relationship;
        const head = node('div', 'fd-team-card__head'); head.append(node('span', 'fd-team-card__mark', initials(team.teamName)));
        const identity = node('div', 'fd-team-card__identity'); const relWrap = document.createElement('div');
        if (team.relationship === 'captain' || team.relationship === 'member') relWrap.append(node('span', 'fd-team-card__relationship', team.relationship === 'captain' ? 'My team · Captain' : 'My team · Player'));
        else if (team.relationship === 'pending') relWrap.append(node('span', 'fd-team-card__pending', 'Request pending'));
        else if (team.relationship === 'directory') relWrap.append(node('span', 'fd-team-card__directory', 'League team'));
        identity.append(relWrap, node('h2', '', team.teamName || 'Unnamed team'), node('p', '', team.seasonName || 'Season')); head.append(identity);
        const facts = node('div', 'fd-team-card__facts');
        const captainFact = document.createElement('span'); captainFact.append(node('small', '', 'Captain'), node('strong', '', team.captainName || (team.isMine ? 'See roster' : 'Captain not assigned')));
        const rosterFact = document.createElement('span'); rosterFact.append(node('small', '', 'Roster'), node('strong', '', team.rosterCount == null ? 'Roster details' : team.rosterCount + ' player' + (team.rosterCount === 1 ? '' : 's'))); facts.append(captainFact, rosterFact);
        const actions = node('div', 'fd-team-card__actions');
        for (const action of relationActions(team)) {
          if (action === 'manage' || action === 'roster') actions.append(button(action === 'manage' ? 'Manage roster' : 'View roster', action, team.teamId));
          else if (action === 'message') { const link = node('a', '', 'Team messages'); link.href = '/messages?team=' + encodeURIComponent(team.teamId); actions.append(link); }
          else if (action === 'cancel') actions.append(button('Cancel request', 'cancel', team.pendingRequestId, true));
          else actions.append(button('Request to join', 'join', team.teamId));
        }
        article.append(head, facts);
        if (team.relationship === 'captain' || team.relationship === 'member') { const details = node('details', 'fd-team-card__details'); const summary = document.createElement('summary'); summary.textContent = team.relationship === 'captain' ? 'Manage roster' : 'View roster'; const roster = document.createElement('div'); renderRoster(team, roster); details.append(summary, roster); article.append(details); }
        article.append(actions); return article;
      }
      function matchesFilter(team) {
        const query = clean(searchInput.value).toLowerCase();
        if (query && !clean(team.teamName + ' ' + team.seasonName).toLowerCase().includes(query)) return false;
        if (filter === 'mine') return team.isMine;
        if (filter === 'open') return team.relationship === 'none';
        return true;
      }
      function renderCards() {
        mineList.replaceChildren(); directoryList.replaceChildren();
        const visible = cards.filter(matchesFilter); const mine = visible.filter((team) => team.isMine); const others = visible.filter((team) => !team.isMine);
        for (const team of mine) mineList.append(renderCard(team));
        for (const team of others) directoryList.append(renderCard(team));
        mineSection.hidden = mine.length === 0; directorySection.hidden = others.length === 0; directoryEmpty.hidden = visible.length > 0;
      }
      function renderInbox() {
        invitationsEl.replaceChildren(); requestsEl.replaceChildren();
        const invitations = management.invitations || []; const captainRequests = requestData.captain_requests || [];
        for (const invite of invitations) { const row = node('div', 'fd-team-invitation'); row.append(node('strong', '', invite.teamName || 'Team'), node('p', '', (invite.seasonName || 'Season') + ' · Invitation')); const actions = document.createElement('div'); actions.append(button('Accept', 'accept-invite', invite.invitationId), button('Decline', 'decline-invite', invite.invitationId, true)); row.append(actions); invitationsEl.append(row); }
        for (const request of captainRequests) { const row = node('div', 'fd-team-request'); row.append(node('strong', '', request.displayName || 'Player'), node('p', '', 'Wants to join ' + (request.teamName || 'your team'))); const actions = document.createElement('div'); actions.append(button('Approve', 'approve-request', request.requestId), button('Decline', 'decline-request', request.requestId, true)); row.append(actions); requestsEl.append(row); }
        if (!invitations.length) invitationsEl.append(node('p', 'fd-team-card__empty', 'No open invitations.'));
        if (!captainRequests.length) requestsEl.append(node('p', 'fd-team-card__empty', 'No join requests need a captain response.'));
        inboxEl.hidden = invitations.length === 0 && captainRequests.length === 0;
      }
      function renderSeasons(seasons) {
        seasonSelect.replaceChildren(); const registrationSeasons = (seasons || []).filter((season) => season.status === 'registration'); const unavailable = new Set(registrations.filter((registration) => (registration.applications || []).some((application) => activeApplicationStatuses.has(application.status))).map((registration) => clean(registration.seasonId))); const open = registrationSeasons.filter((season) => !unavailable.has(clean(season.id)));
        for (const season of open) { const option = document.createElement('option'); option.value = season.id; option.textContent = season.name + ' · New team application'; seasonSelect.append(option); }
        if (!open.length) { const option = document.createElement('option'); option.value = ''; option.textContent = registrationSeasons.length ? 'Application already submitted' : 'No registration season is open'; seasonSelect.append(option); }
        formationForm.querySelector('[data-team-formation-help]').textContent = !open.length && registrationSeasons.length ? 'You already have a team application for the open registration season.' : '';
        seasonSelect.disabled = open.length === 0; teamNameInput.disabled = open.length === 0; formationForm.querySelector('button').disabled = open.length === 0;
      }
      async function loadLeagueTeams(seasons) {
        const active = (seasons || []).filter((season) => ['active', 'playoffs'].includes(season.status));
        const settled = await Promise.all(active.map(async (season) => {
          try {
            const body = await api('/api/seasons/' + encodeURIComponent(season.id) + '/team-standings');
            return (body.standings || []).map((row) => ({
              teamId: row.team_id,
              teamName: row.team_name,
              seasonId: season.id,
              seasonName: season.name,
              standingsRank: row.standings_rank,
              captainName: row.captain_display_name || '',
              relationship: 'directory',
            }));
          } catch { return []; }
        }));
        return settled.flat();
      }
      function renderFormation() {
        formationItems.replaceChildren();
        for (const registration of registrations) {
          for (const item of registration.applications || []) { const row = node('div', 'fd-team-formation'); row.append(node('strong', '', item.proposedTeamName || 'New team'), node('p', '', 'New team application · ' + clean(item.status || 'submitted'))); formationItems.append(row); }
          for (const item of registration.returningSlots || []) { const row = node('div', 'fd-team-formation'); row.append(node('strong', '', item.sourceTeamName || 'Returning team'), node('p', '', 'Returning team reservation · ' + clean(item.status || 'reserved'))); formationItems.append(row); }
        }
      }
      async function load() {
        if (!token()) { stateEl.hidden = false; stateEl.innerHTML = '<strong>Sign in to see your teams</strong><span>Your roster and role-aware actions appear after Google sign-in.</span><br><a href="/profile">Sign in</a>'; contentEl.hidden = true; setStatus('Sign in required'); return; }
        setStatus('Loading teams…'); stateEl.hidden = false; stateEl.textContent = 'Loading teams…';
        try {
          const [teamBody, requestBody, seasonBody] = await Promise.all([api('/api/me/teams'), api('/api/me/team-membership-requests'), api('/api/seasons')]);
          const seasons = seasonBody.seasons || []; const registrationSeasons = seasons.filter((season) => season.status === 'registration'); registrations = await Promise.all(registrationSeasons.map(async (season) => { const body = await api('/api/seasons/' + encodeURIComponent(season.id) + '/team-registration/me'); return { ...(body.registration || {}), seasonId: season.id }; }));
          management = teamBody.teamManagement || {}; requestData = requestBody.requests || {}; requestData.league_teams = await loadLeagueTeams(seasons); cards = normalize();
          renderCards(); renderInbox(); renderSeasons(seasonBody.seasons || []); renderFormation(); contentEl.hidden = false; stateEl.hidden = true; setStatus(cards.length ? cards.length + ' teams available' : 'No teams available', 'ok');
        } catch (error) {
          contentEl.hidden = true; stateEl.hidden = false; stateEl.replaceChildren(node('strong', '', error.status === 401 ? 'Your sign-in expired' : 'Could not load teams'), node('span', '', error.message || 'Try again.')); const retry = button(error.status === 401 ? 'Sign in again' : 'Try again', error.status === 401 ? 'signin' : 'retry'); stateEl.append(retry); setStatus(error.message || 'Could not load teams', 'error');
        }
      }
      async function mutate(action, id) {
        if (action === 'join') await api('/api/teams/' + encodeURIComponent(id) + '/membership-request', { method: 'POST', body: '{}' });
        if (action === 'cancel') await api('/api/team-membership-requests/' + encodeURIComponent(id) + '/cancel', { method: 'POST', body: '{}' });
        if (action === 'accept-invite' || action === 'decline-invite') await api('/api/team-invitations/' + encodeURIComponent(id) + '/respond', { method: 'POST', body: JSON.stringify({ response: action === 'accept-invite' ? 'accepted' : 'declined' }) });
        if (action === 'approve-request' || action === 'decline-request') await api('/api/team-membership-requests/' + encodeURIComponent(id) + '/respond', { method: 'POST', body: JSON.stringify({ response: action === 'approve-request' ? 'approved' : 'declined' }) });
        if (action === 'remove') await api('/api/team-memberships/' + encodeURIComponent(id) + '/remove', { method: 'POST', body: '{}' });
        if (action === 'invite') { const select = document.querySelector('[data-invite-select="' + CSS.escape(id) + '"]'); const playerId = select && select.value; if (!playerId) throw new Error('Choose a player to invite.'); await api('/api/teams/' + encodeURIComponent(id) + '/invitations', { method: 'POST', body: JSON.stringify({ playerId }) }); }
      }
      filters.forEach((control) => control.addEventListener('click', () => { filter = control.dataset.teamFilter; filters.forEach((item) => item.setAttribute('aria-pressed', String(item === control))); renderCards(); }));
      searchInput.addEventListener('input', renderCards);
      document.addEventListener('click', async (event) => {
        const control = event.target.closest('[data-team-action]'); if (!control) return; const action = control.dataset.teamAction; const id = control.dataset.actionId || '';
        if (action === 'manage' || action === 'roster') { const details = control.closest('[data-team-card]').querySelector('details'); details.open = true; details.scrollIntoView({ block: 'nearest' }); return; }
        if (action === 'signin') { location.assign('/profile'); return; } if (action === 'retry') { load(); return; }
        control.disabled = true; setStatus('Updating team…'); try { await mutate(action, id); await load(); setStatus('Team updated', 'ok'); } catch (error) { control.disabled = false; setStatus(friendlyError(error.message), 'error'); }
      });
      formationForm.addEventListener('submit', async (event) => { event.preventDefault(); const seasonId = seasonSelect.value; const teamName = clean(teamNameInput.value); const existing = registrations.find((registration) => clean(registration.seasonId) === seasonId && (registration.applications || []).some((application) => activeApplicationStatuses.has(application.status))); if (existing) { setStatus('You already have a team application for this season.', 'error'); return; } if (!seasonId || !teamName) { setStatus('Choose a season and enter a team name.', 'error'); return; } const submit = formationForm.querySelector('button'); submit.disabled = true; try { await api('/api/seasons/' + encodeURIComponent(seasonId) + '/team-applications', { method: 'POST', body: JSON.stringify({ teamName }) }); teamNameInput.value = ''; await load(); setStatus('New team application submitted', 'ok'); } catch (error) { setStatus(friendlyError(error.message), 'error'); } finally { submit.disabled = seasonSelect.disabled; } });
      load();
    })();
  `;
}

function teamsDocument() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Teams · Fremont Derby</title>
  <style>${jflModernTeamsStyles}</style>
</head>
<body>
  <main class="fd-teams" data-fd-modern-teams="true">
    <header class="fd-teams__header">
      <span class="fd-teams__eyebrow">League teams</span>
      <h1>Teams</h1>
      <p class="fd-teams__lede">Your team appears first. See the captain and roster at a glance, then use only the join or manage actions available to your role.</p>
    </header>
    <section class="fd-teams__toolbar" aria-label="Find teams">
      <div class="fd-teams__toolbar-top"><label>Search teams<input type="search" data-team-search placeholder="Team or season" autocomplete="off" /></label></div>
      <div class="fd-teams__filters" aria-label="Team filters"><button type="button" data-team-filter="all" aria-pressed="true">All teams</button><button type="button" data-team-filter="mine" aria-pressed="false">My teams</button><button type="button" data-team-filter="open" aria-pressed="false">Open to join</button></div>
      <p class="fd-teams__status" data-teams-status role="status" aria-live="polite">Loading teams…</p>
    </section>
    <div class="fd-teams__state" data-teams-state>Loading teams…</div>
    <div data-teams-content hidden>
      <section class="fd-teams__section" data-my-teams-section hidden><div class="fd-teams__section-head"><h2>My teams</h2><span>Current memberships first</span></div><div class="fd-teams__cards" data-my-team-list></div></section>
      <section class="fd-teams__section" data-team-directory-section hidden><div class="fd-teams__section-head"><h2>League teams</h2><span>Join actions reflect your current season membership</span></div><div class="fd-teams__cards" data-team-directory></div></section>
      <div class="fd-teams__state" data-team-directory-empty hidden><strong>No matching teams</strong>Try another name or filter.</div>
      <section class="fd-teams__inbox" data-teams-inbox hidden><article class="fd-teams__panel"><h2>My invitations</h2><div data-team-invitations></div></article><article class="fd-teams__panel"><h2>Requests for teams I captain</h2><div data-captain-requests></div></article></section>
      <details class="fd-teams__formation"><summary>Start or return a team</summary><div class="fd-teams__formation-body"><p class="fd-teams__formation-copy">A new team application is different from a returning-team reservation. Existing reservations stay labeled below so you know which path you are using.</p><form class="fd-teams__formation-form" data-team-formation-form><label>Registration season<select data-team-season></select></label><label>New team name<input data-team-name maxlength="80" autocomplete="organization" /></label><button type="submit">Apply for a team slot</button><p class="fd-teams__formation-copy" data-team-formation-help role="status"></p></form><div data-team-formation-items></div></div></details>
    </div>
    <p class="fd-teams__legacy">JFL preview · <a href="/teams?ui=legacy">View the classic Teams body</a></p>
  </main>
  <script>${teamsClientScript()}</script>
</body>
</html>`;
}

export function renderJflModernTeams() {
  return decorateHtmlWithShell(teamsDocument(), '/teams');
}

export function routeJflModernTeams(request, env = {}) {
  if (env?.ENVIRONMENT !== 'jfl' || !request || request.method !== 'GET') return null;
  const url = new URL(request.url);
  if (url.pathname !== '/teams' || url.searchParams.get('ui') === 'legacy') return null;
  return new Response(renderJflModernTeams(), {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-fremont-ui-mode': 'modern-teams-v1',
    },
  });
}
