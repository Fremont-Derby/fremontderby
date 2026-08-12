import { adminSeasonTeamsHttpHandlers } from './adminSeasonTeamsHttp.js';
import { renderAdminSeasonTeamsPage } from './adminSeasonTeamsPage.js';
import { decorateHtmlWithShell } from './appShell.js';

function htmlResponse(html, pathname) {
  return new Response(decorateHtmlWithShell(html, pathname), {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

function methodNotAllowed() {
  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function routeAdminSeasonTeams(request, env) {
  const url = new URL(request.url);
  if (url.pathname === '/admin/season-teams') {
    if (request.method !== 'GET') return methodNotAllowed();
    return htmlResponse(renderAdminSeasonTeamsPage(), url.pathname);
  }

  const candidates = url.pathname.match(
    /^\/api\/admin\/seasons\/([^/]+)\/team-candidates$/,
  );
  if (candidates) {
    if (request.method !== 'GET') return methodNotAllowed();
    return adminSeasonTeamsHttpHandlers.list(
      request,
      env,
      decodeURIComponent(candidates[1]),
    );
  }

  const preparedTeams = url.pathname.match(
    /^\/api\/admin\/seasons\/([^/]+)\/prepared-teams$/,
  );
  if (preparedTeams) {
    if (request.method !== 'POST') return methodNotAllowed();
    return adminSeasonTeamsHttpHandlers.createPrepared(
      request,
      env,
      decodeURIComponent(preparedTeams[1]),
    );
  }

  const captainCandidates = url.pathname.match(
    /^\/api\/admin\/seasons\/([^/]+)\/teams\/([^/]+)\/captain-candidates$/,
  );
  if (captainCandidates) {
    if (request.method !== 'GET') return methodNotAllowed();
    return adminSeasonTeamsHttpHandlers.listCaptainCandidates(
      request,
      env,
      decodeURIComponent(captainCandidates[1]),
      decodeURIComponent(captainCandidates[2]),
    );
  }

  const assignCaptain = url.pathname.match(
    /^\/api\/admin\/seasons\/([^/]+)\/teams\/([^/]+)\/captain$/,
  );
  if (assignCaptain) {
    if (request.method !== 'POST') return methodNotAllowed();
    return adminSeasonTeamsHttpHandlers.assignCaptain(
      request,
      env,
      decodeURIComponent(assignCaptain[1]),
      decodeURIComponent(assignCaptain[2]),
    );
  }

  const addTeam = url.pathname.match(
    /^\/api\/admin\/seasons\/([^/]+)\/teams\/([^/]+)\/add$/,
  );
  if (addTeam) {
    if (request.method !== 'POST') return methodNotAllowed();
    return adminSeasonTeamsHttpHandlers.add(
      request,
      env,
      decodeURIComponent(addTeam[1]),
      decodeURIComponent(addTeam[2]),
    );
  }

  return null;
}
