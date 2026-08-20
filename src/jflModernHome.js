export function chooseHomeNextAction({
  signedIn = false,
  scorableMatches = [],
  hasTeam = false,
  upcomingContext = null,
  isCaptain = false,
} = {}) {
  if (!signedIn) {
    return {
      kind: 'signin',
      status: 'Welcome',
      title: 'Ready to play?',
      copy: 'Sign in with Google to see your team, next matchup, and the one league task that matters now.',
      label: 'Join / sign in',
      href: '/profile',
    };
  }

  if (Array.isArray(scorableMatches) && scorableMatches.length > 0) {
    return {
      kind: 'score',
      status: 'Ready now',
      title: 'Your match is ready to score.',
      copy: 'Open the scorecard and keep the rack-by-rack result in sync with the other side.',
      label: 'Score the match',
      href: '/scorecard',
    };
  }

  if (upcomingContext) {
    if (isCaptain) {
      return {
        kind: 'lineup',
        status: 'Next up',
        title: 'Set your lineup for the next matchup.',
        copy: 'Choose the players for your team before play. Availability is still available from the Teams page if you need it first.',
        label: 'Set the lineup',
        href: '/lineup',
      };
    }

    return {
      kind: 'availability',
      status: 'Next up',
      title: 'Check in for the next round.',
      copy: 'Mark whether you can play so your captain can build the lineup without chasing people down.',
      label: 'Check in',
      href: '/availability',
    };
  }

  if (!hasTeam) {
    return {
      kind: 'teams',
      status: 'Get started',
      title: 'Find your place in the league.',
      copy: 'Join a team, request a roster spot, or stay available as a free agent.',
      label: 'Find or join a team',
      href: '/teams#join-teams',
    };
  }

  return {
    kind: 'schedule',
    status: 'All clear',
    title: 'See what is coming next.',
    copy: 'There is nothing to score right now. Check the published schedule for your next league night.',
    label: 'View the schedule',
    href: '/schedule',
  };
}

export const jflModernHomeStyles = `
  .fd-home {
    width: min(920px, calc(100% - 24px));
    margin: 0 auto;
    padding: var(--fd-space-4) 0 calc(var(--fd-space-6) * 2);
    display: grid;
    gap: var(--fd-space-4);
  }
  .fd-home [hidden] { display: none !important; }
  .fd-home .fd-page-header { padding-bottom: 0; }
  .fd-home .fd-page-header h1 { max-width: 13ch; }
  .fd-home__lede { max-width: 62ch; }
  .fd-home__facts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--fd-space-2);
    margin-top: var(--fd-space-2);
  }
  .fd-home__fact {
    display: inline-flex;
    align-items: center;
    min-height: 32px;
    padding: 5px 10px;
    border: 1px solid var(--fd-border);
    border-radius: var(--fd-radius-pill);
    background: var(--fd-bg-subtle);
    color: var(--fd-text-muted);
    font-size: .78rem;
    font-weight: 800;
  }
  .fd-home-next {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--fd-space-4);
    padding: clamp(18px, 4vw, 30px);
    border-top: 5px solid var(--fd-primary);
  }
  .fd-home-next__copy { display: grid; gap: var(--fd-space-2); }
  .fd-home-next h2 {
    margin: 0;
    max-width: 24ch;
    font-size: clamp(1.35rem, 4vw, 2rem);
    line-height: 1.08;
    letter-spacing: -.025em;
  }
  .fd-home-next p { max-width: 56ch; margin: 0; line-height: 1.5; }
  .fd-home-next__action {
    min-width: min(220px, 100%);
    min-height: 52px;
    padding-inline: 20px;
    font-size: 1rem;
    white-space: nowrap;
  }
  .fd-home-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.5fr) minmax(240px, .8fr);
    gap: var(--fd-space-4);
    align-items: start;
  }
  .fd-home-stack { display: grid; gap: var(--fd-space-4); }
  .fd-home-section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--fd-space-3);
    margin-bottom: var(--fd-space-3);
  }
  .fd-home-section-head h2 { margin: 0; font-size: 1rem; }
  .fd-home-match {
    display: grid;
    gap: var(--fd-space-3);
  }
  .fd-home-match__teams {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    gap: var(--fd-space-3);
    align-items: center;
  }
  .fd-home-match__team { min-width: 0; font-size: 1.05rem; font-weight: 900; overflow-wrap: anywhere; }
  .fd-home-match__team:last-child { text-align: right; }
  .fd-home-match__versus { color: var(--fd-text-muted); font-size: .75rem; font-weight: 900; text-transform: uppercase; }
  .fd-home-match__meta {
    display: flex;
    flex-wrap: wrap;
    gap: var(--fd-space-2);
    color: var(--fd-text-muted);
    font-size: .84rem;
  }
  .fd-home-match__meta span:not(:last-child)::after {
    content: '·';
    margin-left: var(--fd-space-2);
    color: var(--fd-border-control);
  }
  .fd-home-snapshot { display: grid; gap: var(--fd-space-3); }
  .fd-home-snapshot__row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--fd-space-3);
    align-items: baseline;
    padding-bottom: var(--fd-space-3);
    border-bottom: 1px solid var(--fd-border);
  }
  .fd-home-snapshot__row:last-child { padding-bottom: 0; border-bottom: 0; }
  .fd-home-snapshot__label { color: var(--fd-text-muted); font-size: .75rem; font-weight: 850; text-transform: uppercase; }
  .fd-home-snapshot__value { text-align: right; font-weight: 900; overflow-wrap: anywhere; }
  .fd-home__quiet-link {
    width: fit-content;
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    color: var(--fd-primary-strong);
    font-weight: 800;
  }
  .fd-home a:focus-visible { outline: 3px solid var(--fd-focus); outline-offset: 3px; }
  .fd-home__fallback {
    padding-top: var(--fd-space-2);
    border-top: 1px solid var(--fd-border);
    color: var(--fd-text-muted);
    font-size: .82rem;
  }
  .fd-home__fallback a { min-height: 44px; display: inline-flex; align-items: center; color: inherit; }

  @media (max-width: 720px) {
    .fd-home { width: min(100% - 16px, 920px); }
    .fd-home-next { grid-template-columns: 1fr; }
    .fd-home-next__action { width: 100%; min-width: 0; }
    .fd-home-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 420px) {
    .fd-home-match__teams { grid-template-columns: 1fr; gap: 4px; }
    .fd-home-match__team:last-child { text-align: left; }
    .fd-home-match__versus { display: none; }
    .fd-home-snapshot__row { grid-template-columns: 1fr; gap: 3px; }
    .fd-home-snapshot__value { text-align: left; }
  }
  @media (prefers-reduced-motion: reduce) {
    .fd-home * { scroll-behavior: auto !important; transition: none !important; }
  }
  @media (forced-colors: active) {
    .fd-home-next,
    .fd-home__fact,
    .fd-home-match,
    .fd-home-snapshot { border-color: CanvasText !important; }
  }
`;

function homeClientScript() {
  const chooseActionSource = chooseHomeNextAction.toString();
  return `
    const chooseNextAction = ${chooseActionSource};
    const nextRegion = document.querySelector('[data-fd-next-action]');
    const nextStatus = document.querySelector('[data-next-status]');
    const nextTitle = document.querySelector('[data-next-title]');
    const nextCopy = document.querySelector('[data-next-copy]');
    const nextLink = document.querySelector('[data-next-action-link]');
    const signedInDetails = document.querySelector('[data-signed-in-details]');
    const nextMatchCard = document.querySelector('[data-next-match-card]');
    const homeNotice = document.querySelector('[data-home-notice]');
    const teamNameEl = document.querySelector('[data-team-name]');
    const teamRoleEl = document.querySelector('[data-team-role]');
    const teamSeasonEl = document.querySelector('[data-team-season]');
    const seasonNameEl = document.querySelector('[data-season-name]');
    const seasonStatusEl = document.querySelector('[data-season-status]');
    const seasonRoundEl = document.querySelector('[data-season-round]');
    const matchTeamEl = document.querySelector('[data-match-team]');
    const matchOpponentEl = document.querySelector('[data-match-opponent]');
    const matchMetaEl = document.querySelector('[data-match-meta]');

    function accessToken() {
      return sessionStorage.getItem('fd.accessToken') || '';
    }

    async function readJson(response) {
      const text = await response.text();
      if (!text) return {};
      try { return JSON.parse(text); } catch { return {}; }
    }

    async function api(path, authenticated) {
      const headers = {};
      if (authenticated) {
        const token = accessToken();
        if (!token) {
          const error = new Error('Sign in required');
          error.status = 401;
          throw error;
        }
        headers.authorization = 'Bearer ' + token;
      }
      const response = await fetch(path, { headers });
      const body = await readJson(response);
      if (!response.ok) {
        const error = new Error('Request failed');
        error.status = response.status;
        throw error;
      }
      return body;
    }

    function clean(value) {
      return value == null ? '' : String(value).trim();
    }

    function statusLabel(value) {
      const text = clean(value).replaceAll('_', ' ');
      return text ? text.charAt(0).toUpperCase() + text.slice(1) : 'Not published';
    }

    function dateLabel(value) {
      if (!value) return '';
      const date = new Date(String(value).slice(0, 10) + 'T12:00:00');
      if (Number.isNaN(date.getTime())) return '';
      return new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(date);
    }

    function timeLabel(value) {
      if (!value) return '';
      const raw = String(value);
      const match = raw.match(/(?:T|^)(\\d{2}):(\\d{2})/);
      if (!match) return raw;
      const date = new Date('2000-01-01T' + match[1] + ':' + match[2] + ':00');
      return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date);
    }

    function actionView(action) {
      nextRegion.dataset.actionKind = action.kind;
      nextStatus.textContent = action.status;
      nextTitle.textContent = action.title;
      nextCopy.textContent = action.copy;
      nextLink.textContent = action.label;
      nextLink.href = action.href;
    }

    function activeSeason(seasons, preferredId) {
      const rows = Array.isArray(seasons) ? seasons : [];
      if (preferredId) {
        const exact = rows.find((season) => season.id === preferredId);
        if (exact) return exact;
      }
      return rows.find((season) => ['active', 'playoffs'].includes(String(season.status || '')))
        || rows.find((season) => String(season.status || '') === 'registration')
        || rows[0]
        || null;
    }

    function unfinishedContext(contexts) {
      const rows = Array.isArray(contexts) ? contexts : [];
      const today = new Date().toISOString().slice(0, 10);
      const unfinished = rows.filter((context) => {
        const matchStatus = String(context.teamMatchStatus || '');
        const roundStatus = String(context.roundStatus || '');
        return !['finalized', 'corrected'].includes(matchStatus)
          && !['finalized', 'complete', 'cancelled'].includes(roundStatus);
      });
      unfinished.sort((left, right) => {
        const leftLive = left.teamMatchStatus === 'in_progress' ? 0 : 1;
        const rightLive = right.teamMatchStatus === 'in_progress' ? 0 : 1;
        if (leftLive !== rightLive) return leftLive - rightLive;
        const leftDate = left.scheduledOn || '9999-12-31';
        const rightDate = right.scheduledOn || '9999-12-31';
        const leftPast = leftDate < today ? 1 : 0;
        const rightPast = rightDate < today ? 1 : 0;
        if (leftPast !== rightPast) return leftPast - rightPast;
        return leftDate.localeCompare(rightDate) || Number(left.roundNumber || 0) - Number(right.roundNumber || 0);
      });
      return unfinished[0] || null;
    }

    function teamKey(team) {
      return clean(team && (team.teamId || team.team_id || team.id));
    }

    function teamName(team) {
      return clean(team && (team.teamName || team.team_name || team.name));
    }

    function sameTeam(team, context) {
      const leftId = teamKey(team);
      const rightId = clean(context && context.teamId);
      if (leftId && rightId) return leftId === rightId;
      const leftName = teamName(team).toLowerCase();
      const rightName = clean(context && context.teamName).toLowerCase();
      return Boolean(leftName && rightName && leftName === rightName);
    }

    function pickMatch(round, context) {
      const matches = Array.isArray(round && round.matches) ? round.matches : [];
      const wanted = clean(context && context.teamName).toLowerCase();
      if (!wanted) return null;
      return matches.find((match) => clean(match.teamAName).toLowerCase() === wanted || clean(match.teamBName).toLowerCase() === wanted) || null;
    }

    function opponentName(match, context) {
      if (!match) return '';
      const wanted = clean(context && context.teamName).toLowerCase();
      if (clean(match.teamAName).toLowerCase() === wanted) return clean(match.teamBName);
      if (clean(match.teamBName).toLowerCase() === wanted) return clean(match.teamAName);
      return '';
    }

    function addMatchMeta(value) {
      if (!value) return;
      const span = document.createElement('span');
      span.textContent = value;
      matchMetaEl.append(span);
    }

    async function renderMatch(context) {
      if (!context || !context.seasonId || !context.teamName) return;
      try {
        const schedule = await api('/api/seasons/' + encodeURIComponent(context.seasonId) + '/schedule', false);
        const rounds = Array.isArray(schedule.rounds) ? schedule.rounds : [];
        const round = rounds.find((row) => row.roundId === context.roundId)
          || rounds.find((row) => row.roundNumber === context.roundNumber)
          || null;
        const match = pickMatch(round, context);
        const opponent = opponentName(match, context);
        matchTeamEl.textContent = context.teamName;
        matchOpponentEl.textContent = opponent || 'Opponent TBD';
        matchMetaEl.replaceChildren();
        addMatchMeta(dateLabel((round && round.scheduledOn) || context.scheduledOn));
        addMatchMeta(timeLabel(match && (match.scheduledTime || match.startTime) || round && (round.scheduledTime || round.startTime)));
        addMatchMeta(clean(match && (match.venueName || match.venue) || round && (round.venueName || round.venue)));
        const table = clean(match && match.tableNumber || context.tableNumber);
        if (table) addMatchMeta('Table ' + table);
        nextMatchCard.hidden = false;
      } catch {
        matchTeamEl.textContent = context.teamName;
        matchOpponentEl.textContent = 'Next matchup';
        matchMetaEl.replaceChildren();
        addMatchMeta(dateLabel(context.scheduledOn));
        if (context.tableNumber) addMatchMeta('Table ' + context.tableNumber);
        nextMatchCard.hidden = false;
      }
    }

    function renderSeason(season, context) {
      if (!season && !context) return;
      seasonNameEl.textContent = clean(season && season.name) || clean(context && context.seasonName) || 'Current season';
      seasonStatusEl.textContent = statusLabel(season && season.status);
      seasonStatusEl.className = 'fd-status' + (season && ['active', 'playoffs'].includes(String(season.status || '')) ? ' fd-status--success' : '');
      seasonRoundEl.textContent = context && context.roundNumber ? 'Round ' + context.roundNumber + ' next' : 'Schedule available';
    }

    function renderTeam(management, context, captain) {
      const captainTeams = Array.isArray(management && management.captain_teams) ? management.captain_teams : [];
      const fallbackTeam = captainTeams[0] || null;
      const name = clean(context && context.teamName) || teamName(fallbackTeam) || (context && context.participationType === 'free_agent' ? 'Free agent' : 'No team yet');
      teamNameEl.textContent = name;
      teamRoleEl.textContent = context && context.participationType === 'free_agent' ? 'Free agent' : (captain ? 'Captain' : 'Player');
      teamSeasonEl.textContent = clean(context && context.seasonName) || 'Current season';
    }

    async function bootstrap() {
      const signedIn = Boolean(accessToken());
      const publicSeasonsPromise = api('/api/seasons', false).catch(() => ({ seasons: [] }));

      if (!signedIn) {
        actionView(chooseNextAction({ signedIn: false }));
        const publicSeasons = await publicSeasonsPromise;
        renderSeason(activeSeason(publicSeasons.seasons), null);
        return;
      }

      const [profileResult, teamsResult, scoringResult, publicSeasons] = await Promise.all([
        api('/api/me/profile', true).catch((error) => ({ __error: error })),
        api('/api/me/teams', true).catch((error) => ({ __error: error })),
        api('/api/me/scorable-matches', true).catch((error) => ({ __error: error })),
        publicSeasonsPromise,
      ]);

      if (profileResult.__error && profileResult.__error.status === 401) {
        actionView(chooseNextAction({ signedIn: false }));
        renderSeason(activeSeason(publicSeasons.seasons), null);
        homeNotice.hidden = false;
        homeNotice.textContent = 'Your sign-in expired. Sign in again to refresh your league night.';
        return;
      }

      const management = teamsResult.teamManagement || {};
      const contexts = Array.isArray(management.availability_contexts) ? management.availability_contexts : [];
      const context = unfinishedContext(contexts);
      const captainTeams = Array.isArray(management.captain_teams) ? management.captain_teams : [];
      const hasTeam = contexts.some((item) => item.participationType === 'roster') || captainTeams.length > 0;
      const captain = context ? captainTeams.some((team) => sameTeam(team, context)) : captainTeams.length > 0;
      const scorableMatches = Array.isArray(scoringResult.matches) ? scoringResult.matches : [];
      const action = chooseNextAction({ signedIn: true, scorableMatches, hasTeam, upcomingContext: context, isCaptain: captain });
      actionView(action);

      signedInDetails.hidden = false;
      renderTeam(management, context, captain);
      const season = activeSeason(publicSeasons.seasons, context && context.seasonId);
      renderSeason(season, context);
      await renderMatch(context);

      if (teamsResult.__error || scoringResult.__error) {
        homeNotice.hidden = false;
        homeNotice.textContent = 'Some league details are still loading. Your main action above is safe to use.';
      }
    }

    bootstrap().catch(() => {
      actionView(chooseNextAction({ signedIn: Boolean(accessToken()), hasTeam: false }));
      homeNotice.hidden = false;
      homeNotice.textContent = 'We could not load every league detail. Nothing was changed.';
    });
  `;
}

export function renderJflModernHome() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Home · Fremont Derby</title>
  <style>${jflModernHomeStyles}</style>
</head>
<body>
  <main class="fd-home" data-fd-modern-home="true">
    <header class="fd-page-header">
      <span class="fd-eyebrow">Fremont Derby</span>
      <h1>Know what to do next.</h1>
      <p class="fd-home__lede">Cash pool league with flexible scheduling, team competition, and an individual race for cash. The Home page keeps the next useful action in front of you.</p>
      <div class="fd-home__facts" aria-label="League format">
        <span class="fd-home__fact">12-week calendar</span>
        <span class="fd-home__fact">3 players per regular-season matchup</span>
        <span class="fd-home__fact">Free agents can compete</span>
      </div>
    </header>

    <p class="fd-error-state" data-home-notice role="status" aria-live="polite" hidden></p>

    <section class="fd-card fd-home-next" data-fd-next-action aria-labelledby="fd-home-next-title" aria-live="polite">
      <div class="fd-home-next__copy">
        <span class="fd-status" data-next-status>Welcome</span>
        <h2 id="fd-home-next-title" data-next-title>Ready to play?</h2>
        <p data-next-copy>Sign in with Google to see your team, next matchup, and the one league task that matters now.</p>
      </div>
      <a class="fd-action fd-action--primary fd-home-next__action" data-next-action-link href="/profile">Join / sign in</a>
    </section>

    <section class="fd-home-grid" data-signed-in-details hidden aria-label="Your league snapshot">
      <div class="fd-home-stack">
        <article class="fd-card fd-home-match" data-next-match-card hidden>
          <div class="fd-home-section-head">
            <h2>Your next matchup</h2>
            <a class="fd-home__quiet-link" href="/schedule">Full schedule</a>
          </div>
          <div class="fd-home-match__teams">
            <strong class="fd-home-match__team" data-match-team>Your team</strong>
            <span class="fd-home-match__versus">vs</span>
            <strong class="fd-home-match__team" data-match-opponent>Opponent</strong>
          </div>
          <div class="fd-home-match__meta" data-match-meta></div>
        </article>

        <article class="fd-card">
          <div class="fd-home-section-head"><h2>Season</h2><span class="fd-status" data-season-status>Loading</span></div>
          <div class="fd-home-snapshot">
            <div class="fd-home-snapshot__row"><span class="fd-home-snapshot__label">Season</span><strong class="fd-home-snapshot__value" data-season-name>Current season</strong></div>
            <div class="fd-home-snapshot__row"><span class="fd-home-snapshot__label">Next</span><strong class="fd-home-snapshot__value" data-season-round>Schedule available</strong></div>
          </div>
        </article>
      </div>

      <article class="fd-card fd-card--quiet">
        <div class="fd-home-section-head"><h2>Your team</h2><a class="fd-home__quiet-link" href="/teams">Open team</a></div>
        <div class="fd-home-snapshot">
          <div class="fd-home-snapshot__row"><span class="fd-home-snapshot__label">Team</span><strong class="fd-home-snapshot__value" data-team-name>Loading</strong></div>
          <div class="fd-home-snapshot__row"><span class="fd-home-snapshot__label">Role</span><strong class="fd-home-snapshot__value" data-team-role>Player</strong></div>
          <div class="fd-home-snapshot__row"><span class="fd-home-snapshot__label">Season</span><strong class="fd-home-snapshot__value" data-team-season>Current season</strong></div>
        </div>
      </article>
    </section>

    <p class="fd-home__fallback">JFL preview · <a href="/?ui=legacy">View the classic Home body</a></p>
  </main>
  <script>${homeClientScript()}</script>
</body>
</html>`;
}

export function routeJflModernHome(request, env = {}) {
  if (env?.ENVIRONMENT !== 'jfl' || !request || request.method !== 'GET') return null;
  const url = new URL(request.url);
  if (url.pathname !== '/' || url.searchParams.get('ui') === 'legacy') return null;

  return new Response(renderJflModernHome(), {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-fremont-ui-mode': 'modern-home-v1',
    },
  });
}
