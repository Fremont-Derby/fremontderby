import app from './index.js';
import { renderDemoSeasonPage } from './demoSeasonPage.js';
import { dualScoringHttpHandlers } from './dualScoringHttp.js';
import { playoffHttpHandlers } from './playoffHttp.js';
import { renderIntroPage, renderRulesPage } from './publicPages.js';

function htmlResponse(html) {
  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

function faviconResponse() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Fremont Derby"><rect width="64" height="64" rx="14" fill="#07150f"/><circle cx="32" cy="32" r="22" fill="#e7f2eb"/><circle cx="32" cy="32" r="15" fill="#173f2a"/><path d="M23 39V23h19v6H30v4h10v6H30v6h-7Z" fill="#f4f7f5"/></svg>`;
  return new Response(svg, {
    headers: {
      'content-type': 'image/svg+xml; charset=utf-8',
      'cache-control': 'public, max-age=86400',
    },
  });
}

function methodNotAllowed() {
  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const adminStartPlayoffsMatch = url.pathname.match(
      /^\/api\/admin\/seasons\/([^/]+)\/start-playoffs$/,
    );
    const adminDualScoreOverrideMatch = url.pathname.match(
      /^\/api\/admin\/player-matches\/([^/]+)\/finalize-override$/,
    );
    const dualScoreCompareMatch = url.pathname.match(
      /^\/api\/player-matches\/([^/]+)\/score-comparison$/,
    );
    const dualScoreRackMatch = url.pathname.match(
      /^\/api\/player-matches\/([^/]+)\/score-racks$/,
    );
    const dualScoreUndoMatch = url.pathname.match(
      /^\/api\/player-matches\/([^/]+)\/score-racks\/undo$/,
    );
    const dualScoreConfirmMatch = url.pathname.match(
      /^\/api\/player-matches\/([^/]+)\/score-confirm$/,
    );
    const dualScoreFinalizeMatch = url.pathname.match(
      /^\/api\/player-matches\/([^/]+)\/finalize-reconciled$/,
    );

    if (request.method === 'GET' && url.pathname === '/favicon.svg') {
      return faviconResponse();
    }

    if (request.method === 'GET' && url.pathname === '/') {
      return htmlResponse(renderIntroPage());
    }

    if (request.method === 'GET' && url.pathname === '/rules') {
      return htmlResponse(renderRulesPage());
    }

    if (url.pathname === '/demo') {
      if (request.method !== 'GET') return methodNotAllowed();
      return htmlResponse(renderDemoSeasonPage());
    }

    if (adminStartPlayoffsMatch) {
      if (request.method !== 'POST') return methodNotAllowed();
      return playoffHttpHandlers.start(
        request,
        env,
        decodeURIComponent(adminStartPlayoffsMatch[1]),
      );
    }

    if (adminDualScoreOverrideMatch) {
      if (request.method !== 'POST') return methodNotAllowed();
      return dualScoringHttpHandlers.adminOverride(
        request,
        env,
        decodeURIComponent(adminDualScoreOverrideMatch[1]),
      );
    }

    if (dualScoreCompareMatch) {
      if (request.method !== 'GET') return methodNotAllowed();
      return dualScoringHttpHandlers.compare(
        request,
        env,
        decodeURIComponent(dualScoreCompareMatch[1]),
      );
    }

    if (dualScoreRackMatch) {
      if (request.method !== 'POST') return methodNotAllowed();
      return dualScoringHttpHandlers.record(
        request,
        env,
        decodeURIComponent(dualScoreRackMatch[1]),
      );
    }

    if (dualScoreUndoMatch) {
      if (request.method !== 'POST') return methodNotAllowed();
      return dualScoringHttpHandlers.undo(
        request,
        env,
        decodeURIComponent(dualScoreUndoMatch[1]),
      );
    }

    if (dualScoreConfirmMatch) {
      if (request.method !== 'POST') return methodNotAllowed();
      return dualScoringHttpHandlers.confirm(
        request,
        env,
        decodeURIComponent(dualScoreConfirmMatch[1]),
      );
    }

    if (dualScoreFinalizeMatch) {
      if (request.method !== 'POST') return methodNotAllowed();
      return dualScoringHttpHandlers.finalize(
        request,
        env,
        decodeURIComponent(dualScoreFinalizeMatch[1]),
      );
    }

    return app.fetch(request, env, ctx);
  },
};
