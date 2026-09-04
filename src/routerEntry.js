import { injectAccessibilityLayer } from './accessibilityLayer.js';
import { injectAdminGatewayTheme } from './adminGatewayTheme.js';
import { injectAdminSurfaceTheme } from './adminSurfaceTheme.js';
import { handleCreateAdminPlayerRequest } from './adminCreatePlayerHttp.js';
import { routeAdminGateway } from './adminGatewayRouter.js';
import { decorateHtmlWithShell, renderNotFoundPage } from './appShell.js';
import { routeDateAvailability } from './dateAvailabilityHttp.js';
import { injectLineupTheme } from './lineupTheme.js';
import legacyRouter from './router.js';
import { routeAdminSeasonTeams } from './adminSeasonTeamsRouter.js';
import { injectMessagesTheme } from './messagesTheme.js';
import { injectMobileMenuAccessibility } from './mobileMenuAccessibility.js';
import { injectPersistentAuthSession } from './persistentAuthSession.js';
import { injectPlayerSurfaceTheme } from './playerSurfaceTheme.js';
import { routePlayerClaim } from './playerClaimHttp.js';
import { routePlayerContact } from './playerContactHttp.js';
import { enhanceProfileContact } from './profileContactEnhancer.js';
import { enhanceProfilePlayerClaim } from './profilePlayerClaimEnhancer.js';
import { enhanceProfileSeasonRegistration } from './profileSeasonRegistrationEnhancer.js';
import { routePlayerSeasonRegistration } from './playerSeasonRegistrationHttp.js';
import { enhancePublicSeasonSelection } from './publicSeasonSelectionEnhancer.js';
import { injectPublicSurfaceTheme } from './publicSurfaceTheme.js';
import { enhanceScheduleAvailability } from './scheduleAvailabilityEnhancer.js';
import { routeSeasonClose } from './seasonCloseHttp.js';
import { enhanceSeasonClose } from './seasonCloseEnhancer.js';
import { enhanceSeasonPublishReadiness } from './seasonPublishReadinessEnhancer.js';
import { injectSiteStyles } from './siteStyles.js';
import { injectStandingsTheme } from './standingsTheme.js';
import { enhanceTeamsCanonicalActions } from './teamsCanonicalActionsEnhancer.js';
import { injectTeamsTheme } from './teamsTheme.js';
import { renderPlayoffsPage } from './playoffsPage.js';
import { renderPlayersDirectoryPage } from './playersDirectoryPage.js';
import { renderNotificationsPage } from './notificationsPage.js';
import { renderFreeAgentsPage } from './freeAgentsPage.js';
import { renderPracticePage } from './practicePage.js';
import { routeDruPublicEmptyReads } from './druPublicEmptyReadsHttp.js';
import { routeDruEnvironmentHealth } from './druEnvironmentHttp.js';

const RETIRED_TRADE_API_PATTERNS = [
  /^\/api\/me\/trades$/,
  /^\/api\/teams\/[^/]+\/trades$/,
  /^\/api\/team-trades\/[^/]+\/(player-response|captain-approval)$/,
  /^\/api\/admin\/teams\/[^/]+\/trades$/,
  /^\/trades\/?$/,
  /^\/trade\/?$/,
];

const PUBLIC_HTML_PAGES = new Map([
  ['/playoffs', renderPlayoffsPage],
  ['/playoff', renderPlayoffsPage],
  ['/bracket', renderPlayoffsPage],
  ['/brackets', renderPlayoffsPage],
  ['/players', renderPlayersDirectoryPage],
  ['/player', renderPlayersDirectoryPage],
  ['/directory', renderPlayersDirectoryPage],
  ['/notifications', renderNotificationsPage],
  ['/notify', renderNotificationsPage],
  ['/free-agents', renderFreeAgentsPage],
  ['/fa', renderFreeAgentsPage],
  ['/subs', renderFreeAgentsPage],
  ['/substitutes', renderFreeAgentsPage],
  ['/practice', renderPracticePage],
  ['/practices', renderPracticePage],
]);

const LIVE_PAGE_REWRITES = new Map([
  ['/check-in', '/availability'],
  ['/checkin', '/availability'],
  ['/league-night', '/availability'],
  ['/leaguenight', '/availability'],
  ['/ready-check', '/availability'],
  ['/readycheck', '/availability'],
  ['/inbox', '/messages'],
  ['/chat', '/messages'],
  ['/msg', '/messages'],
  ['/msgs', '/messages'],
  ['/account', '/profile'],
  ['/settings', '/profile'],
  ['/me', '/profile'],
  ['/login', '/profile'],
  ['/signin', '/profile'],
  ['/sign-in', '/profile'],
  ['/scoring', '/scorecard'],
  ['/score', '/scorecard'],
  ['/scores', '/scorecard'],
  ['/awards', '/prizes'],
  ['/prize', '/prizes'],
  ['/stats', '/standings'],
  ['/history', '/standings'],
  ['/tonight', '/schedule'],
  ['/week', '/schedule'],
  ['/schedules', '/schedule'],
  ['/matches', '/schedule'],
  ['/roster', '/teams'],
  ['/join', '/teams'],
  ['/captain', '/teams'],
  ['/lineups', '/lineup'],
  ['/sandbox', '/demo'],
  ['/try', '/demo'],
  ['/home', '/'],
]);

function stripTrailingSlash(pathname) {
  return pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

function isRetiredTradePath(pathname) {
  return RETIRED_TRADE_API_PATTERNS.some((pattern) => pattern.test(pathname));
}

function retiredTradeResponse(request, pathname) {
  if (pathname.startsWith('/api/')) return Response.json({ error: 'Not found' }, { status: 404 });
  if (request.method !== 'GET') return Response.json({ error: 'Method not allowed' }, { status: 405 });
  return new Response(decorateHtmlWithShell(renderNotFoundPage(pathname), pathname), {
    status: 404,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  });
}

function htmlPageResponse(render, pathname) {
  return new Response(decorateHtmlWithShell(render(), pathname), {
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  });
}

async function reconcileProductShell(response, pathname) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;
  const headers = new Headers(response.headers);
  let html = await response.text();

  if (pathname === '/season-setup') {
    const link = '<p style="margin:12px 0"><a href="/admin/season-teams" style="display:inline-flex;min-height:48px;align-items:center;padding:0 16px;border-radius:10px;background:#43bd7d;color:#07110b;font-weight:900;text-decoration:none">Manage season teams</a></p>';
    html = html.replace('</main>', link + '</main>');
  }
  if (pathname === '/profile') {
    const playersLink = '<a href="/admin/players">Players</a>';
    const adminGatewayLink = '<a href="/admin">Admin home</a>';
    const moderationLink = '<a href="/messages/moderation">Moderation</a>';
    const seasonTeamsLink = '<a href="/admin/season-teams">Season teams</a>';
    html = html.replace(playersLink, adminGatewayLink + playersLink);
    html = html.replace(moderationLink, seasonTeamsLink + moderationLink);
  }
  if (pathname === '/demo') {
    html = html
      .replace('<title>Try a League Night · Fremont Derby</title>', '<title>Test Drive the App · Fremont Derby</title>')
      .replace('<h1>Try a League Night</h1>', '<h1>Test Drive the App</h1>');
  }
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}

async function finalizeBrowserResponse(response, pathname) {
  const seasonSelected = await enhancePublicSeasonSelection(response, pathname);
  const designed = await injectSiteStyles(seasonSelected);
  const publicThemed = await injectPublicSurfaceTheme(designed, pathname);
  const playerThemed = await injectPlayerSurfaceTheme(publicThemed, pathname);
  const standingsThemed = await injectStandingsTheme(playerThemed, pathname);
  const lineupThemed = await injectLineupTheme(standingsThemed, pathname);
  const messagesThemed = await injectMessagesTheme(lineupThemed);
  const teamsThemed = await injectTeamsTheme(messagesThemed);
  const adminGatewayThemed = await injectAdminGatewayTheme(teamsThemed);
  const adminThemed = await injectAdminSurfaceTheme(adminGatewayThemed, pathname);
  const accessible = await injectAccessibilityLayer(adminThemed);
  const mobileMenuAccessible = await injectMobileMenuAccessibility(accessible);
  return injectPersistentAuthSession(mobileMenuAccessible);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = stripTrailingSlash(url.pathname);

    const environmentResponse = routeDruEnvironmentHealth(request, env);
    if (environmentResponse) {
      return finalizeBrowserResponse(environmentResponse, url.pathname);
    }

    if (isRetiredTradePath(url.pathname)) {
      return finalizeBrowserResponse(retiredTradeResponse(request, url.pathname), url.pathname);
    }

    const emptyReadResponse = routeDruPublicEmptyReads(request, env);
    if (emptyReadResponse) {
      return finalizeBrowserResponse(emptyReadResponse, url.pathname);
    }

    if (request.method === 'GET') {
      const render = PUBLIC_HTML_PAGES.get(pathname);
      if (render) {
        return finalizeBrowserResponse(htmlPageResponse(render, pathname), pathname);
      }
      const rewritten = LIVE_PAGE_REWRITES.get(pathname);
      if (rewritten) {
        const next = new URL(request.url);
        next.pathname = rewritten;
        request = new Request(next, request);
        url.pathname = rewritten;
      }
    }

    if (url.pathname === '/api/admin/players' && request.method === 'POST') return finalizeBrowserResponse(await handleCreateAdminPlayerRequest(request, env), url.pathname);
    const playerClaimResponse = await routePlayerClaim(request, env);
    if (playerClaimResponse) return finalizeBrowserResponse(playerClaimResponse, url.pathname);
    const playerContactResponse = await routePlayerContact(request, env);
    if (playerContactResponse) return finalizeBrowserResponse(playerContactResponse, url.pathname);
    const playerSeasonRegistrationResponse = await routePlayerSeasonRegistration(request, env);
    if (playerSeasonRegistrationResponse) return finalizeBrowserResponse(playerSeasonRegistrationResponse, url.pathname);
    const dateAvailabilityResponse = await routeDateAvailability(request, env);
    if (dateAvailabilityResponse) return finalizeBrowserResponse(dateAvailabilityResponse, url.pathname);
    const seasonCloseResponse = await routeSeasonClose(request, env);
    if (seasonCloseResponse) return finalizeBrowserResponse(seasonCloseResponse, url.pathname);
    const adminGatewayResponse = routeAdminGateway(request);
    if (adminGatewayResponse) return finalizeBrowserResponse(adminGatewayResponse, url.pathname);
    const adminSeasonTeamsResponse = await routeAdminSeasonTeams(request, env);
    if (adminSeasonTeamsResponse) return finalizeBrowserResponse(adminSeasonTeamsResponse, url.pathname);
    const response = await legacyRouter.fetch(request, env, ctx);
    const reconciled = await reconcileProductShell(response, url.pathname);
    if (url.pathname === '/schedule' && request.method === 'GET') return finalizeBrowserResponse(await enhanceScheduleAvailability(reconciled), url.pathname);
    if (url.pathname === '/teams' && request.method === 'GET') return finalizeBrowserResponse(await enhanceTeamsCanonicalActions(reconciled), url.pathname);
    if (url.pathname === '/season-setup' && request.method === 'GET') {
      const withPublishReadiness = await enhanceSeasonPublishReadiness(reconciled);
      return finalizeBrowserResponse(await enhanceSeasonClose(withPublishReadiness), url.pathname);
    }
    if (url.pathname === '/profile' && request.method === 'GET') {
      const withSeasonRegistration = await enhanceProfileSeasonRegistration(reconciled);
      const withContact = await enhanceProfileContact(withSeasonRegistration);
      return finalizeBrowserResponse(await enhanceProfilePlayerClaim(withContact), url.pathname);
    }
    return finalizeBrowserResponse(reconciled, url.pathname);
  },
};
