import app from './index.js';
import {
  decorateHtmlWithShell,
  isKnownAppPagePath,
  renderNotFoundPage,
} from './appShell.js';
import { renderCaptainSandboxPage } from './captainSandboxPage.js';
import { chatHttpHandlers } from './chatHttp.js';
import { renderChatModerationPage } from './chatModerationPage.js';
import { renderChatPage } from './chatPage.js';
import { renderDemoSeasonPage } from './demoSeasonPage.js';
import { dualScoringHttpHandlers } from './dualScoringHttp.js';
import { playoffHttpHandlers } from './playoffHttp.js';
import { renderPlayerSandboxPage } from './playerSandboxPage.js';
import { renderIntroPage, renderRulesPage } from './publicPages.js';
import { scorableMatchesHttpHandlers } from './scorableMatchesHttp.js';
import { renderScorePickerPage } from './scorePickerPage.js';

function htmlResponse(html, pathname, status = 200) {
  return new Response(decorateHtmlWithShell(html, pathname), {
    status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

function stripLegacyPublicNav(html) {
  return html.replace(
    /\s*<nav aria-label="Main navigation">[\s\S]*?<\/nav>/i,
    '',
  );
}

async function decorateAppResponse(response, pathname) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;

  const headers = new Headers(response.headers);
  headers.set('content-type', 'text/html; charset=utf-8');
  headers.set('cache-control', 'no-store');

  return new Response(
    decorateHtmlWithShell(await response.text(), pathname),
    {
      status: response.status,
      statusText: response.statusText,
      headers,
    },
  );
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

function isDelegatedNonPagePath(pathname) {
  return pathname.startsWith('/api/') || pathname.startsWith('/health');
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
    const teamChatMessagesMatch = url.pathname.match(
      /^\/api\/teams\/([^/]+)\/messages$/,
    );
    const teamChatReadMatch = url.pathname.match(
      /^\/api\/teams\/([^/]+)\/messages\/read$/,
    );
    const directMessagesMatch = url.pathname.match(
      /^\/api\/direct-conversations\/([^/]+)\/messages$/,
    );
    const directReadMatch = url.pathname.match(
      /^\/api\/direct-conversations\/([^/]+)\/messages\/read$/,
    );
    const playerBlockMatch = url.pathname.match(
      /^\/api\/players\/([^/]+)\/block$/,
    );
    const leagueMessagesMatch = url.pathname.match(
      /^\/api\/seasons\/([^/]+)\/messages$/,
    );
    const leagueReadMatch = url.pathname.match(
      /^\/api\/seasons\/([^/]+)\/messages\/read$/,
    );
    const moderateChatReportMatch = url.pathname.match(
      /^\/api\/admin\/chat-reports\/([^/]+)\/resolve$/,
    );
    const matchupMessagesMatch = url.pathname.match(
      /^\/api\/team-matches\/([^/]+)\/messages$/,
    );
    const matchupReadMatch = url.pathname.match(
      /^\/api\/team-matches\/([^/]+)\/messages\/read$/,
    );

    if (request.method === 'GET' && url.pathname === '/favicon.svg') {
      return faviconResponse();
    }

    if (request.method === 'GET' && url.pathname === '/') {
      return htmlResponse(stripLegacyPublicNav(renderIntroPage()), url.pathname);
    }

    if (request.method === 'GET' && url.pathname === '/rules') {
      return htmlResponse(stripLegacyPublicNav(renderRulesPage()), url.pathname);
    }

    if (url.pathname === '/demo') {
      if (request.method !== 'GET') return methodNotAllowed();
      return htmlResponse(renderDemoSeasonPage(), url.pathname);
    }

    if (url.pathname === '/sandbox/player') {
      if (request.method !== 'GET') return methodNotAllowed();
      return htmlResponse(renderPlayerSandboxPage(), url.pathname);
    }

    if (url.pathname === '/sandbox/captain') {
      if (request.method !== 'GET') return methodNotAllowed();
      return htmlResponse(renderCaptainSandboxPage(), url.pathname);
    }

    if (url.pathname === '/messages') {
      if (request.method !== 'GET') return methodNotAllowed();
      return htmlResponse(renderChatPage(env), url.pathname);
    }

    if (url.pathname === '/messages/moderation') {
      if (request.method !== 'GET') return methodNotAllowed();
      return htmlResponse(renderChatModerationPage(env), url.pathname);
    }

    if (url.pathname === '/scorecard') {
      if (request.method !== 'GET') return methodNotAllowed();
      return htmlResponse(renderScorePickerPage(), url.pathname);
    }

    if (url.pathname === '/scorecard/live') {
      if (request.method !== 'GET') return methodNotAllowed();
      const delegatedUrl = new URL(request.url);
      delegatedUrl.pathname = '/scorecard';
      const delegatedRequest = new Request(delegatedUrl, request);
      const response = await app.fetch(delegatedRequest, env, ctx);
      return decorateAppResponse(response, '/scorecard');
    }

    if (url.pathname === '/api/me/scorable-matches') {
      if (request.method !== 'GET') return methodNotAllowed();
      return scorableMatchesHttpHandlers.list(request, env);
    }

    if (url.pathname === '/api/me/chat-threads') {
      if (request.method !== 'GET') return methodNotAllowed();
      return chatHttpHandlers.listThreads(request, env);
    }

    if (url.pathname === '/api/me/league-chat-threads') {
      if (request.method !== 'GET') return methodNotAllowed();
      return chatHttpHandlers.listLeagueThreads(request, env);
    }

    if (url.pathname === '/api/me/matchup-chat-threads') {
      if (request.method !== 'GET') return methodNotAllowed();
      return chatHttpHandlers.listMatchupThreads(request, env);
    }

    if (matchupReadMatch) {
      if (request.method !== 'POST') return methodNotAllowed();
      return chatHttpHandlers.markMatchupChatRead(
        request, env, decodeURIComponent(matchupReadMatch[1]),
      );
    }

    if (matchupMessagesMatch) {
      const teamMatchId = decodeURIComponent(matchupMessagesMatch[1]);
      if (request.method === 'GET') {
        return chatHttpHandlers.listMatchupMessages(request, env, teamMatchId);
      }
      if (request.method === 'POST') {
        return chatHttpHandlers.sendMatchupMessage(request, env, teamMatchId);
      }
      return methodNotAllowed();
    }

    if (url.pathname === '/api/chat-reports') {
      if (request.method !== 'POST') return methodNotAllowed();
      return chatHttpHandlers.reportMessage(request, env);
    }

    if (url.pathname === '/api/admin/chat-reports') {
      if (request.method !== 'GET') return methodNotAllowed();
      return chatHttpHandlers.listReports(request, env);
    }

    if (moderateChatReportMatch) {
      if (request.method !== 'POST') return methodNotAllowed();
      return chatHttpHandlers.moderateReport(
        request, env, decodeURIComponent(moderateChatReportMatch[1]),
      );
    }

    if (leagueReadMatch) {
      if (request.method !== 'POST') return methodNotAllowed();
      return chatHttpHandlers.markLeagueChatRead(
        request, env, decodeURIComponent(leagueReadMatch[1]),
      );
    }

    if (leagueMessagesMatch) {
      const seasonId = decodeURIComponent(leagueMessagesMatch[1]);
      if (request.method === 'GET') {
        return chatHttpHandlers.listLeagueMessages(request, env, seasonId);
      }
      if (request.method === 'POST') {
        return chatHttpHandlers.sendLeagueMessage(request, env, seasonId);
      }
      return methodNotAllowed();
    }

    if (url.pathname === '/api/me/direct-message-inbox') {
      if (request.method !== 'GET') return methodNotAllowed();
      return chatHttpHandlers.listDirectInbox(request, env);
    }

    if (url.pathname === '/api/me/direct-message-candidates') {
      if (request.method !== 'GET') return methodNotAllowed();
      return chatHttpHandlers.listDirectCandidates(request, env);
    }

    if (url.pathname === '/api/me/blocked-players') {
      if (request.method !== 'GET') return methodNotAllowed();
      return chatHttpHandlers.listBlockedPlayers(request, env);
    }

    if (url.pathname === '/api/direct-conversations') {
      if (request.method !== 'POST') return methodNotAllowed();
      return chatHttpHandlers.startDirectConversation(request, env);
    }

    if (directReadMatch) {
      if (request.method !== 'POST') return methodNotAllowed();
      return chatHttpHandlers.markDirectChatRead(
        request,
        env,
        decodeURIComponent(directReadMatch[1]),
      );
    }

    if (directMessagesMatch) {
      const conversationId = decodeURIComponent(directMessagesMatch[1]);
      if (request.method === 'GET') {
        return chatHttpHandlers.listDirectMessages(request, env, conversationId);
      }
      if (request.method === 'POST') {
        return chatHttpHandlers.sendDirectMessage(request, env, conversationId);
      }
      return methodNotAllowed();
    }

    if (playerBlockMatch) {
      const playerId = decodeURIComponent(playerBlockMatch[1]);
      if (request.method === 'POST') {
        return chatHttpHandlers.blockPlayer(request, env, playerId);
      }
      if (request.method === 'DELETE') {
        return chatHttpHandlers.unblockPlayer(request, env, playerId);
      }
      return methodNotAllowed();
    }

    if (teamChatReadMatch) {
      if (request.method !== 'POST') return methodNotAllowed();
      return chatHttpHandlers.markTeamChatRead(
        request,
        env,
        decodeURIComponent(teamChatReadMatch[1]),
      );
    }

    if (teamChatMessagesMatch) {
      const teamId = decodeURIComponent(teamChatMessagesMatch[1]);
      if (request.method === 'GET') {
        return chatHttpHandlers.listTeamMessages(request, env, teamId);
      }
      if (request.method === 'POST') {
        return chatHttpHandlers.sendTeamMessage(request, env, teamId);
      }
      return methodNotAllowed();
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

    if (
      !isDelegatedNonPagePath(url.pathname)
      && !isKnownAppPagePath(url.pathname)
    ) {
      if (request.method !== 'GET') return methodNotAllowed();
      return htmlResponse(renderNotFoundPage(url.pathname), url.pathname, 404);
    }

    const response = await app.fetch(request, env, ctx);
    return decorateAppResponse(response, url.pathname);
  },
};
