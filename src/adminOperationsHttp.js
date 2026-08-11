import { environmentReadiness } from './environmentReadiness.js';
import { createAdminOperationsRepository } from './adminOperationsRepository.js';
import { AuthError, authenticateSupabaseUser } from './supabaseAuth.js';

const severityRank = { healthy: 0, warning: 1, critical: 2 };

function metric(raw, name) {
  const item = raw.metrics?.[name];
  return item?.available ? Number(item.value || 0) : null;
}

function action(severity, code, title, detail, href = null) {
  return { severity, code, title, detail, href };
}

export function buildAdminOperationsOverview(raw, readiness) {
  const actions = [];
  const unavailable = Object.entries(raw.metrics || {})
    .filter(([, item]) => !item.available)
    .map(([name]) => name);

  if (!readiness.ok) {
    actions.push(action(
      'critical', 'environment_not_ready', 'Environment is not ready',
      'The Worker bindings or Supabase project do not match this environment.', '/health/environment',
    ));
  }
  if (!raw.season) {
    actions.push(action(
      'warning', 'season_missing', 'No current season',
      'Create or select a season before teams, lineups, scoring, and readiness can be measured.',
      '/season-setup',
    ));
  } else if (metric(raw, 'teams') === 0) {
    actions.push(action(
      'warning', 'teams_missing', 'No teams created',
      `${raw.season.name} has no teams yet.`, '/teams',
    ));
  }

  const seasonPlayers = metric(raw, 'seasonPlayers');
  const ratings = metric(raw, 'ratings');
  if (seasonPlayers !== null && ratings !== null && seasonPlayers > ratings) {
    actions.push(action(
      'critical', 'ratings_missing', 'Players need handicap seeds',
      `${seasonPlayers - ratings} registered player(s) do not have a current rating record.`,
      '/profile',
    ));
  }
  const paidPlayers = metric(raw, 'paidPlayers');
  if (seasonPlayers !== null && paidPlayers !== null && seasonPlayers > paidPlayers) {
    actions.push(action(
      'warning', 'payments_incomplete', 'Player payments are incomplete',
      `${seasonPlayers - paidPlayers} registered player(s) are not marked paid.`, '/teams',
    ));
  }
  const openReports = metric(raw, 'openReports');
  if (openReports > 0) {
    actions.push(action(
      'warning', 'reports_open', 'Chat reports need review',
      `${openReports} report(s) are open or under review.`, '/messages/moderation',
    ));
  }
  const liveMatches = metric(raw, 'liveMatches');
  if (liveMatches > 0) {
    actions.push(action(
      'warning', 'matches_live', 'Matches are still in progress',
      `${liveMatches} player match(es) have started but are not finalized.`, '/scorecard',
    ));
  }
  if (unavailable.length) {
    actions.push(action(
      'warning', 'metrics_unavailable', 'Some health metrics are unavailable',
      `Could not read: ${unavailable.join(', ')}. Other dashboard sections remain available.`,
    ));
  }

  actions.sort((a, b) => severityRank[b.severity] - severityRank[a.severity]);
  const overall = actions.reduce(
    (current, item) => severityRank[item.severity] > severityRank[current] ? item.severity : current,
    'healthy',
  );
  const messages = ['teamMessages', 'directMessages', 'leagueMessages', 'matchupMessages']
    .reduce((total, name) => total + (metric(raw, name) ?? 0), 0);

  return {
    generatedAt: raw.generatedAt,
    overall,
    season: raw.season,
    counts: {
      profiles: metric(raw, 'profiles'),
      seasonPlayers,
      teams: metric(raw, 'teams'),
      paidPlayers,
      rounds: metric(raw, 'rounds'),
      teamMatches: metric(raw, 'teamMatches'),
      lineups: metric(raw, 'lineups'),
      playerMatches: metric(raw, 'playerMatches'),
      liveMatches,
      finalizedMatches: metric(raw, 'finalizedMatches'),
      forfeits: metric(raw, 'forfeits'),
      ratings,
      openReports,
      messages,
      teamMessages: metric(raw, 'teamMessages'),
      directMessages: metric(raw, 'directMessages'),
      leagueMessages: metric(raw, 'leagueMessages'),
      matchupMessages: metric(raw, 'matchupMessages'),
    },
    rating: { latestUpdatedAt: raw.latestRatingUpdate },
    environment: readiness,
    actions,
  };
}

function statusForError(error) {
  if (error instanceof AuthError) return error.status;
  if (/League admin access/i.test(error.message)) return 403;
  return 502;
}

export async function handleAdminOperationsRequest(
  request,
  env,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const repository = createAdminOperationsRepository(env, { fetch: fetchImpl });
    const raw = await repository.getOverview({ actorUserId: actor.id });
    return Response.json(
      { overview: buildAdminOperationsOverview(raw, environmentReadiness(env)) },
      { headers: { 'cache-control': 'no-store' } },
    );
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: statusForError(error), headers: { 'cache-control': 'no-store' } },
    );
  }
}

export const adminOperationsHttpHandlers = { overview: handleAdminOperationsRequest };
