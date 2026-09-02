import { injectAccessibilityLayer } from './accessibilityLayer.js';
import { injectAdminGatewayTheme } from './adminGatewayTheme.js';
import { injectAdminSurfaceTheme } from './adminSurfaceTheme.js';
import { handleCreateAdminPlayerRequest } from './adminCreatePlayerHttp.js';
import { routeAdminGateway } from './adminGatewayRouter.js';
import { decorateHtmlWithShell, renderNotFoundPage } from './appShell.js';
import { routeDateAvailability } from './dateAvailabilityHttp.js';
import { renderJflNotFoundPage } from './jflNotFoundPage.js';
import { routeJflModernHome } from './jflModernHome.js';
import { routeJflModernSchedule } from './jflModernSchedule.js';
import { routeJflModernStandings } from './jflModernStandings.js';
import { routeJflModernTeams } from './jflModernTeams.js';
import { decorateJflModernShell } from './jflModernShell.js';
import { routeJflSeasonSchedule } from './jflSeasonScheduleHttp.js';
import { injectJflSimulatedGoogleAuth } from './jflSimulatedGoogleAuth.js';
import { injectLineupTheme } from './lineupTheme.js';
import { renderPlayersDirectoryPage } from './playersDirectoryPage.js';
import legacyRouter from './router.js';
import { routeAdminSeasonTeams } from './adminSeasonTeamsRouter.js';
import { injectMessagesTheme } from './messagesTheme.js';
import { injectMobileMenuAccessibility } from './mobileMenuAccessibility.js';
import { routeModernUiCatalog } from './modernUiCatalog.js';
import { decorateModernUiSliceResponse } from './modernUiSlice.js';
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

const RETIRED_TRADE_API_PATTERNS = [
  /^\/api\/me\/trades$/,
  /^\/api\/teams\/[^/]+\/trades$/,
  /^\/api\/team-trades\/[^/]+\/(player-response|captain-approval)$/,
  /^\/api\/admin\/teams\/[^/]+\/trades$/,
];

function isRetiredTradePath(pathname) {
  return pathname === '/trades'
    || RETIRED_TRADE_API_PATTERNS.some((pattern) => pattern.test(pathname));
}

function retiredTradeResponse(request, pathname) {
  if (pathname.startsWith('/api/')) return Response.json({ error: 'Not found' }, { status: 404 });
  if (request.method !== 'GET') return Response.json({ error: 'Method not allowed' }, { status: 405 });
  return new Response(decorateHtmlWithShell(renderNotFoundPage(pathname), pathname), {
    status: 404,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  });
}

function jflNotFoundResponse(pathname) {
  return new Response(decorateHtmlWithShell(renderJflNotFoundPage(pathname), pathname), {
    status: 404,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  });
}

function isHtmlResponse(response) {
  return (response.headers.get('content-type') || '').includes('text/html');
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

const baseRouterEntry = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const jflSeasonScheduleResponse = await routeJflSeasonSchedule(request, env);
    if (jflSeasonScheduleResponse) return jflSeasonScheduleResponse;
    const modernHomeResponse = routeJflModernHome(request, env);
    if (modernHomeResponse) {
      return finalizeBrowserResponse(modernHomeResponse, url.pathname);
    }
    const modernScheduleResponse = routeJflModernSchedule(request, env);
    if (modernScheduleResponse) {
      const withAvailability = await enhanceScheduleAvailability(modernScheduleResponse);
      return finalizeBrowserResponse(withAvailability, url.pathname);
    }
    const modernStandingsResponse = routeJflModernStandings(request, env);
    if (modernStandingsResponse) {
      return finalizeBrowserResponse(modernStandingsResponse, url.pathname);
    }
    const modernTeamsResponse = routeJflModernTeams(request, env);
    if (modernTeamsResponse) {
      return finalizeBrowserResponse(modernTeamsResponse, url.pathname);
    }
    const modernUiCatalogResponse = routeModernUiCatalog(request, env);
    if (modernUiCatalogResponse) {
      return finalizeBrowserResponse(modernUiCatalogResponse, url.pathname);
    }
    if (url.pathname === '/players' && request.method === 'GET') {
      return finalizeBrowserResponse(new Response(renderPlayersDirectoryPage(), {
        headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
      }), url.pathname);
    }
    if (isRetiredTradePath(url.pathname)) {
      const response = env.ENVIRONMENT === 'jfl' && !url.pathname.startsWith('/api/')
        ? jflNotFoundResponse(url.pathname)
        : retiredTradeResponse(request, url.pathname);
      return finalizeBrowserResponse(response, url.pathname);
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
    if (env.ENVIRONMENT === 'jfl' && response.status === 404 && isHtmlResponse(response)) {
      return finalizeBrowserResponse(jflNotFoundResponse(url.pathname), url.pathname);
    }
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
      const withPlayerClaim = await enhanceProfilePlayerClaim(withContact);
      return finalizeBrowserResponse(await injectJflSimulatedGoogleAuth(withPlayerClaim, env), url.pathname);
    }
    const finalized = await finalizeBrowserResponse(reconciled, url.pathname);
    return decorateModernUiSliceResponse(finalized, request, env);
  },
};

export default {
  async fetch(request, env, ctx) {
    const response = await baseRouterEntry.fetch(request, env, ctx);
    return decorateJflModernShell(response, request, env);
  },
};
