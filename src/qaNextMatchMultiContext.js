import { activePlayerNextMatchMission } from './qaPlayerNextMatchMission2.js';

function futureDate(value, days) {
  const date = new Date(`${String(value || '').slice(0, 10)}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return String(value || '');
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function buildNextMatchMultiContext(fixture) {
  const { seed, team, nextMatch } = fixture;
  const primarySeason = { id: `qa-next-${seed}`, name: 'Tuesday Derby', status: 'active' };
  const secondarySeason = { id: `qa-next-alt-${seed}`, name: 'Sunday Derby', status: 'active' };
  const secondaryTeam = { id: `qa-alt-team-${seed}`, name: 'Break Room Regulars' };
  const secondaryOpponent = { id: `qa-alt-opponent-${seed}`, name: 'Corner Pocket Crew' };
  const secondaryDate = futureDate(nextMatch.date, 4);

  const primaryContext = {
    teamId: team.id,
    teamName: team.name,
    seasonId: primarySeason.id,
    seasonName: primarySeason.name,
    participationType: 'roster',
    roundId: `qa-primary-round-${seed}`,
    roundNumber: nextMatch.roundNumber || 1,
    scheduledOn: nextMatch.date,
    teamMatchStatus: 'scheduled',
    roundStatus: 'scheduled',
    tableNumber: 2,
  };
  const secondaryContext = {
    teamId: secondaryTeam.id,
    teamName: secondaryTeam.name,
    seasonId: secondarySeason.id,
    seasonName: secondarySeason.name,
    participationType: 'roster',
    roundId: `qa-secondary-round-${seed}`,
    roundNumber: 2,
    scheduledOn: secondaryDate,
    teamMatchStatus: 'scheduled',
    roundStatus: 'scheduled',
    tableNumber: 4,
  };

  const schedules = {
    [primarySeason.id]: {
      season: primarySeason,
      rounds: [{
        roundId: primaryContext.roundId,
        roundNumber: primaryContext.roundNumber,
        stage: 'regular',
        scheduledOn: nextMatch.date,
        status: 'scheduled',
        matches: [{
          teamMatchId: nextMatch.id,
          teamAId: team.id,
          teamAName: team.name,
          teamBId: nextMatch.opponent.id,
          teamBName: nextMatch.opponent.name,
          scheduledTime: nextMatch.time,
          venueName: nextMatch.venue,
          tableNumber: 2,
          status: 'scheduled',
        }],
      }],
    },
    [secondarySeason.id]: {
      season: secondarySeason,
      rounds: [{
        roundId: secondaryContext.roundId,
        roundNumber: secondaryContext.roundNumber,
        stage: 'regular',
        scheduledOn: secondaryDate,
        status: 'scheduled',
        matches: [{
          teamMatchId: `qa-secondary-match-${seed}`,
          teamAId: secondaryTeam.id,
          teamAName: secondaryTeam.name,
          teamBId: secondaryOpponent.id,
          teamBName: secondaryOpponent.name,
          scheduledTime: '19:30',
          venueName: 'The Corner Table',
          tableNumber: 4,
          status: 'scheduled',
        }],
      }],
    },
  };

  return {
    seasons: [secondarySeason, primarySeason],
    contexts: [secondaryContext, primaryContext],
    schedules,
    primaryContext,
  };
}

export function routeQaNextMatchMultiContext(request, env = {}) {
  const active = activePlayerNextMatchMission(request, env);
  if (!active || request?.method !== 'GET') return null;
  const url = new URL(request.url);
  const data = buildNextMatchMultiContext(active.fixture);

  if (url.pathname === '/api/seasons') {
    return Response.json({ seasons: data.seasons }, { headers: { 'cache-control': 'no-store' } });
  }
  if (url.pathname === '/api/me/teams') {
    return Response.json({
      teamManagement: {
        availability_contexts: data.contexts,
        captain_teams: [],
      },
    }, { headers: { 'cache-control': 'no-store' } });
  }
  if (url.pathname.startsWith('/api/seasons/') && url.pathname.endsWith('/schedule')) {
    const seasonId = decodeURIComponent(url.pathname.slice('/api/seasons/'.length, -'/schedule'.length));
    const schedule = data.schedules[seasonId];
    if (schedule) return Response.json(schedule, { headers: { 'cache-control': 'no-store' } });
  }
  return null;
}

export async function enhanceQaNextMatchHome(response, request, env = {}) {
  const active = activePlayerNextMatchMission(request, env);
  if (!response || !active || request?.method !== 'GET') return response;
  const url = new URL(request.url);
  if (url.pathname !== '/' || !(response.headers.get('content-type') || '').includes('text/html')) return response;

  const html = await response.text();
  const fixture = active.fixture;
  const data = buildNextMatchMultiContext(fixture);
  const context = data.primaryContext;
  const visible = `<div class="fd-qa-next-proof" role="note" aria-label="Staged next match"><span>YOUR NEXT MATCH · ${context.seasonName}</span><strong>${fixture.team.name} vs ${fixture.nextMatch.opponent.name}</strong><p>${fixture.nextMatch.date} · ${fixture.nextMatch.time} · ${fixture.nextMatch.venue} · Table 2</p><small>Soonest of 2 teams across 2 active seasons</small></div>`;
  const css = `<style>.fd-qa-next-proof{margin:0 0 var(--fd-space-3);padding:14px 16px;border:2px solid var(--fd-primary);border-radius:var(--fd-radius-lg);background:var(--fd-bg-surface);box-shadow:var(--fd-shadow-sm)}.fd-qa-next-proof span{display:block;color:var(--fd-primary-strong);font-size:.72rem;font-weight:950;letter-spacing:.06em}.fd-qa-next-proof strong{display:block;margin-top:5px;font-size:1.15rem;line-height:1.2}.fd-qa-next-proof p{margin:6px 0 0;font-weight:800;line-height:1.35}.fd-qa-next-proof small{display:block;margin-top:5px;color:var(--fd-text-muted);font-weight:750}</style>`;
  const enhanced = html
    .replace('</head>', `${css}</head>`)
    .replace('<section class="fd-card fd-home-next"', `${visible}<section class="fd-card fd-home-next"`);
  const headers = new Headers(response.headers);
  headers.set('cache-control', 'no-store');
  headers.append('set-cookie', `fd_qa_mission_reached=${encodeURIComponent(fixture.seed)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=14400`);
  return new Response(enhanced, { status: response.status, statusText: response.statusText, headers });
}
