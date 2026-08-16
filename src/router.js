import { createRequestNonce, htmlSecurityHeaders, apiSecurityHeaders } from './securityHeaders.js';
import app from './index.js';
import { renderPlayersDirectoryPage } from './playersDirectoryPage.js';
import { renderDesignSystemCatalogPage } from './designSystemCatalogPage.js';
import { adminOperationsHttpHandlers } from './adminOperationsHttp.js';
import { renderAdminOperationsPage } from './adminOperationsPage.js';
import { renderAdminAuditPage } from './adminAuditPage.js';
import { adminPlayersHttpHandlers } from './adminPlayersHttp.js';
import { renderAdminPlayersPage } from './adminPlayersPage.js';
import { renderAdminSeasonsPage } from './adminSeasonsPage.js';
import {
  decorateHtmlWithShell,
  isKnownAppPagePath,
  renderNotFoundPage,
} from './appShell.js';
import { renderCaptainSandboxPage } from './captainSandboxPage.js';
import { chatHttpHandlers } from './chatHttp.js';
import { renderChatModerationPage } from './chatModerationPage.js';
import { renderNotificationsPage } from './notificationsPage.js';
import { renderChatPage } from './chatPage.js';
import { renderDemoSeasonPage } from './demoSeasonPage.js';
import { dualScoringHttpHandlers } from './dualScoringHttp.js';
import { playoffHttpHandlers } from './playoffHttp.js';
import { renderPlayerSandboxPage } from './playerSandboxPage.js';
import { renderIntroPage, renderRulesPage } from './publicPages.js';
import { renderSchedulePage } from './schedulePage.js';
import { renderPlayoffsPage } from './playoffsPage.js';
import { renderTradesPage } from './tradesPage.js';
import { scorableMatchesHttpHandlers } from './scorableMatchesHttp.js';
import { readyCheckHttpHandlers } from './readyCheckHttp.js';
import { renderScorePickerPage } from './scorePickerPage.js';
import { teamMatchChoiceHttpHandlers } from './teamMatchChoiceHttp.js';
import { teamMembershipRequestHttpHandlers } from './teamMembershipRequestHttp.js';
import {
  matchApiTeamsPath,
  matchApiTeamMatchesPath,
  matchApiSeasonMessagesPath,
} from './pathMatch.js';

function htmlResponse(html, pathname, status = 200) {
  const nonce = createRequestNonce();
  return new Response(decorateHtmlWithShell(html, pathname, { nonce }), {
    status,
    headers: htmlSecurityHeaders(nonce),
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

  const nonce = createRequestNonce();
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(htmlSecurityHeaders(nonce))) {
    headers.set(key, value);
  }

  return new Response(
    decorateHtmlWithShell(await response.text(), pathname, { nonce }),
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
    const adminAdvanceChampionshipMatch = url.pathname.match(
      /^\/api\/admin\/seasons\/([^/]+)\/advance-championship$/,
    );
    const adminDualScoreOverrideMatch = url.pathname.match(
      /^\/api\/admin\/player-matches\/([^/]+)\/finalize-override$/,
    );
    const adminPlayerRoleMatch = url.pathname.match(
      /^\/api\/admin\/players\/([^/]+)\/admin-role$/,
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
    const teamPath = matchApiTeamsPath(url.pathname);
    const teamMatchPath = matchApiTeamMatchesPath(url.pathname);
    const seasonMessagesPath = matchApiSeasonMessagesPath(url.pathname);
    const directMessagesMatch = url.pathname.match(
      /^\/api\/direct-conversations\/([^/]+)\/messages$/,
    );
    const directReadMatch = url.pathname.match(
      /^\/api\/direct-conversations\/([^/]+)\/messages\/read$/,
    );
    const playerBlockMatch = url.pathname.match(
      /^\/api\/players\/([^/]+)\/block$/,
    );
    const moderateChatReportMatch = url.pathname.match(
      /^\/api\/admin\/chat-reports\/([^/]+)\/resolve$/,
    );
    const membershipRequestResponseMatch = url.pathname.match(
      /^\/api\/team-membership-requests\/([^/]+)\/respond$/,
    );
    const membershipRequestCancelMatch = url.pathname.match(
      /^\/api\/team-membership-requests\/([^/]+)\/cancel$/,
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
    if (request.method === 'GET' && url.pathname === '/design-system') {
      return htmlResponse(renderDesignSystemCatalogPage(), url.pathname);
    }


    if (url.pathname === '/playoffs') {
      return htmlResponse(renderPlayoffsPage(), url.pathname);
    }
    if (url.pathname === '/trades') {
      if (request.method !== 'GET') return methodNotAllowed();
      return htmlResponse(renderTradesPage(), url.pathname);
    }
    if (url.pathname === '/players') {
      return htmlResponse(renderPlayersDirectoryPage(), url.pathname);
    }

    if (url.pathname === '/schedule') {
      if (request.method !== 'GET') return methodNotAllowed();
      return htmlResponse(renderSchedulePage(), url.pathname);
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

    if (url.pathname === '/notifications') {
      return htmlResponse(renderNotificationsPage());
    }
    if (url.pathname === '/messages') {
      if (request.method !== 'GET') return methodNotAllowed();
      return htmlResponse(renderChatPage(env), url.pathname);
    }

    if (url.pathname === '/messages/moderation') {
      if (request.method !== 'GET') return methodNotAllowed();
      return htmlResponse(renderChatModerationPage(env), url.pathname);
    }

    if (url.pathname === '/admin/audit') {
      return htmlResponse(renderAdminAuditPage(), url.pathname);
    }
    if (url.pathname === '/admin/operations') {
      if (request.method !== 'GET') return methodNotAllowed();
      return htmlResponse(renderAdminOperationsPage(env), url.pathname);
    }

    if (url.pathname === '/admin/players') {
      if (request.method !== 'GET') return methodNotAllowed();
      return htmlResponse(renderAdminPlayersPage(), url.pathname);
    }

    if (url.pathname === '/admin/seasons') {
      if (request.method !== 'GET') return methodNotAllowed();
      return htmlResponse(renderAdminSeasonsPage(), url.pathname);
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

    if (url.pathname === '/api/me/scorable-matches' || url.pathname === '/api/me/matches') {
      if (request.method !== 'GET') return methodNotAllowed();
      return scorableMatchesHttpHandlers.list(request, env);
    }

    if (
      url.pathname === '/api/me/ready-checks'
      || url.pathname === '/api/me/ready-check'
      || url.pathname === '/api/ready-checks/pending'
    ) {
      if (request.method !== 'GET') return methodNotAllowed();
      return readyCheckHttpHandlers.listPending(request, env);
    }

    if (url.pathname === '/api/teams/ready-checks' && request.method === 'POST') {
      return readyCheckHttpHandlers.start(request, env);
    }

    const readyCheckRespondMatch = url.pathname.match(/^\/api\/ready-checks\/([^/]+)\/respond$/);
    if (readyCheckRespondMatch) {
      if (request.method !== 'POST') return methodNotAllowed();
      return readyCheckHttpHandlers.respond(
        request,
        env,
        decodeURIComponent(readyCheckRespondMatch[1]),
      );
    }

    if (url.pathname === '/api/me/team-match-choices') {
      if (request.method !== 'GET') return methodNotAllowed();
      return teamMatchChoiceHttpHandlers.list(request, env);
    }

    if (teamMatchPath?.kind === 'team-choice') {
      if (request.method !== 'PUT') return methodNotAllowed();
      return teamMatchChoiceHttpHandlers.choose(
        request,
        env,
        teamMatchPath.teamMatchId,
      );
    }

    if (url.pathname === '/api/me/team-membership-requests' || url.pathname === '/api/me/membership-requests') {
      if (request.method !== 'GET') return methodNotAllowed();
      return teamMembershipRequestHttpHandlers.list(request, env);
    }

    if (teamPath?.kind === 'membership-request') {
      if (request.method !== 'POST') return methodNotAllowed();
      return teamMembershipRequestHttpHandlers.requestJoin(
        request,
        env,
        teamPath.teamId,
      );
    }

    if (membershipRequestResponseMatch) {
      if (request.method !== 'POST') return methodNotAllowed();
      return teamMembershipRequestHttpHandlers.respond(
        request,
        env,
        decodeURIComponent(membershipRequestResponseMatch[1]),
      );
    }

    if (membershipRequestCancelMatch) {
      if (request.method !== 'POST') return methodNotAllowed();
      return teamMembershipRequestHttpHandlers.cancel(
        request,
        env,
        decodeURIComponent(membershipRequestCancelMatch[1]),
      );
    }

    if (url.pathname === '/api/me/chat-threads') {
      if (request.method !== 'GET') return methodNotAllowed();
      return chatHttpHandlers.listThreads(request, env);
    }

    if (url.pathname === '/api/me/message-notification-summary') {
      if (request.method !== 'GET') return methodNotAllowed();
      return chatHttpHandlers.notificationSummary(request, env);
    }

    if (url.pathname === '/api/me/league-chat-threads') {
      if (request.method !== 'GET') return methodNotAllowed();
      return chatHttpHandlers.listLeagueThreads(request, env);
    }

    if (url.pathname === '/api/me/matchup-chat-threads') {
      if (request.method !== 'GET') return methodNotAllowed();
      return chatHttpHandlers.listMatchupThreads(request, env);
    }

    if (teamMatchPath?.kind === 'messages-read') {
      if (request.method !== 'POST') return methodNotAllowed();
      return chatHttpHandlers.markMatchupChatRead(
        request, env, teamMatchPath.teamMatchId,
      );
    }

    if (teamMatchPath?.kind === 'messages') {
      const teamMatchId = teamMatchPath.teamMatchId;
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

    if (url.pathname === '/api/admin/operations') {
      if (request.method !== 'GET') return methodNotAllowed();
      return adminOperationsHttpHandlers.overview(request, env);
    }

    if (url.pathname === '/api/admin/players') {
      if (request.method !== 'GET') return methodNotAllowed();
      return adminPlayersHttpHandlers.list(request, env);
    }

    if (adminPlayerRoleMatch) {
      if (request.method !== 'PUT') return methodNotAllowed();
      return adminPlayersHttpHandlers.setAdminRole(
        request,
        env,
        decodeURIComponent(adminPlayerRoleMatch[1]),
      );
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

    if (seasonMessagesPath?.kind === 'messages-read') {
      if (request.method !== 'POST') return methodNotAllowed();
      return chatHttpHandlers.markLeagueChatRead(
        request, env, seasonMessagesPath.seasonId,
      );
    }

    if (seasonMessagesPath?.kind === 'messages') {
      const seasonId = seasonMessagesPath.seasonId;
      if (request.method === 'GET') {
        return chatHttpHandlers.listLeagueMessages(request, env, seasonId);
      }
      if (request.method === 'POST') {
        return chatHttpHandlers.sendLeagueMessage(request, env, seasonId);
      }
      return methodNotAllowed();
    }

    if (
      url.pathname === '/api/me/direct-message-inbox'
      || url.pathname === '/api/me/direct-conversations'
      || url.pathname === '/api/me/direct-messages'
      || url.pathname === '/api/me/dms'
    ) {
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

    if (teamPath?.kind === 'messages-read') {
      if (request.method !== 'POST') return methodNotAllowed();
      return chatHttpHandlers.markTeamChatRead(
        request,
        env,
        teamPath.teamId,
      );
    }

    if (teamPath?.kind === 'messages') {
      if (request.method === 'GET') {
        return chatHttpHandlers.listTeamMessages(request, env, teamPath.teamId);
      }
      if (request.method === 'POST') {
        return chatHttpHandlers.sendTeamMessage(request, env, teamPath.teamId);
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

    if (adminAdvanceChampionshipMatch) {
      if (request.method !== 'POST') return methodNotAllowed();
      return playoffHttpHandlers.advance(
        request,
        env,
        decodeURIComponent(adminAdvanceChampionshipMatch[1]),
      );
    }

    if (teamMatchPath?.kind === 'postseason-lineup') {
      if (request.method !== 'POST') return methodNotAllowed();
      return playoffHttpHandlers.submitLineup(
        request,
        env,
        teamMatchPath.teamMatchId,
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
