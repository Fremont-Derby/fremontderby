import { injectAccessibilityLayer } from './accessibilityLayer.js';
import { injectAdminGatewayTheme } from './adminGatewayTheme.js';
import { injectAdminSurfaceTheme } from './adminSurfaceTheme.js';
import { repairAdminPlayersScript } from './adminPlayersScriptRepair.js';
import { repairAvailabilityScript } from './availabilityScriptRepair.js';
import { repairAdminSeasonTeamsScript } from './adminSeasonTeamsScriptRepair.js';
import { repairScorecardScript } from './scorecardScriptRepair.js';
import { repairLineupScript } from './lineupScriptRepair.js';
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
import { injectDruAgentSession } from './druAgentSession.js';
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
import { routeDruKidLeagueSeed } from './druKidLeagueSeedHttp.js';

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
      .replace('<title>Try a League Night \u00b7 Fremont Derby</title>', '<title>Test Drive the App \u00b7 Fremont Derby</title>')
      .replace('<h1>Try a League Night</h1>', '<h1>Test Drive the App</h1>');
  }
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}

async function finalizeBrowserResponse(response, pathname, env = {}) {
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
  const adminScriptRepaired = pathname === '/admin/players'
    ? new Response(repairAdminPlayersScript(await adminThemed.clone().text()), {
        status: adminThemed.status,
        statusText: adminThemed.statusText,
        headers: adminThemed.headers,
      })
    : adminThemed;
  const availabilityRepaired = pathname === '/availability'
    ? new Response(repairAvailabilityScript(await adminScriptRepaired.clone().text()), {
        status: adminScriptRepaired.status,
        statusText: adminScriptRepaired.statusText,
        headers: adminScriptRepaired.headers,
      })
    : adminScriptRepaired;
  const seasonTeamsRepaired = pathname === '/admin/season-teams'
    ? new Response(repairAdminSeasonTeamsScript(await availabilityRepaired.clone().text()), {
        status: availabilityRepaired.status,
        statusText: availabilityRepaired.statusText,
        headers: availabilityRepaired.headers,
      })
    : availabilityRepaired;
  const scorecardRepaired = pathname === '/scorecard'
    ? new Response(repairScorecardScript(await seasonTeamsRepaired.clone().text()), {
        status: seasonTeamsRepaired.status,
        statusText: seasonTeamsRepaired.statusText,
        headers: seasonTeamsRepaired.headers,
      })
    : seasonTeamsRepaired;
  const lineupRepaired = pathname === '/lineup'
    ? new Response(repairLineupScript(await scorecardRepaired.clone().text()), {
        status: scorecardRepaired.status,
        statusText: scorecardRepaired.statusText,
        headers: scorecardRepaired.headers,
      })
    : scorecardRepaired;
  const accessible = await injectAccessibilityLayer(lineupRepaired);
  const mobileMenuAccessible = await injectMobileMenuAccessibility(accessible);
  const persistent = await injectPersistentAuthSession(mobileMenuAccessible);
  return injectDruAgentSession(persistent, env);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = stripTrailingSlash(url.pathname);
    const page = (response, path = url.pathname) => finalizeBrowserResponse(response, path, env);

    const environmentResponse = routeDruEnvironmentHealth(request, env);
    if (environmentResponse) {
      return page(environmentResponse);
    }

    const kidLeagueSeedResponse = await routeDruKidLeagueSeed(request, env);
    if (kidLeagueSeedResponse) {
      return page(kidLeagueSeedResponse);
    }

    if (isRetiredTradePath(url.pathname)) {
      return page(retiredTradeResponse(request, url.pathname));
    }

    const emptyReadResponse = routeDruPublicEmptyReads(request, env);
    if (emptyReadResponse) {
      return page(emptyReadResponse);
    }

    if (request.method === 'GET') {
      const render = PUBLIC_HTML_PAGES.get(pathname);
      if (render) {
        return page(htmlPageResponse(render, pathname), pathname);
      }
      const rewritten = LIVE_PAGE_REWRITES.get(pathname);
      if (rewritten) {
        const next = new URL(request.url);
        next.pathname = rewritten;
        request = new Request(next, request);
        url.pathname = rewritten;
      }
    }

    if (url.pathname === '/api/admin/players' && request.method === 'POST') return page(await handleCreateAdminPlayerRequest(request, env));
    const playerClaimResponse = await routePlayerClaim(request, env);
    if (playerClaimResponse) return page(playerClaimResponse);
    const playerContactResponse = await routePlayerContact(request, env);
    if (playerContactResponse) return page(playerContactResponse);
    const playerSeasonRegistrationResponse = await routePlayerSeasonRegistration(request, env);
    if (playerSeasonRegistrationResponse) return page(playerSeasonRegistrationResponse);
    const dateAvailabilityResponse = await routeDateAvailability(request, env);
    if (dateAvailabilityResponse) return page(dateAvailabilityResponse);
    const seasonCloseResponse = await routeSeasonClose(request, env);
    if (seasonCloseResponse) return page(seasonCloseResponse);
    const adminGatewayResponse = routeAdminGateway(request);
    if (adminGatewayResponse) return page(adminGatewayResponse);
    const adminSeasonTeamsResponse = await routeAdminSeasonTeams(request, env);
    if (adminSeasonTeamsResponse) return page(adminSeasonTeamsResponse);
    const response = await legacyRouter.fetch(request, env, ctx);
    const reconciled = await reconcileProductShell(response, url.pathname);
    if (url.pathname === '/schedule' && request.method === 'GET') return page(await enhanceScheduleAvailability(reconciled));
    if (url.pathname === '/teams' && request.method === 'GET') return page(await enhanceTeamsCanonicalActions(reconciled));
    if (url.pathname === '/season-setup' && request.method === 'GET') {
      const withPublishReadiness = await enhanceSeasonPublishReadiness(reconciled);
      return page(await enhanceSeasonClose(withPublishReadiness));
    }
    if (url.pathname === '/profile' && request.method === 'GET') {
      const withSeasonRegistration = await enhanceProfileSeasonRegistration(reconciled);
      const withContact = await enhanceProfileContact(withSeasonRegistration);
      return page(await enhanceProfilePlayerClaim(withContact));
    }
    return page(reconciled);
  },
};
