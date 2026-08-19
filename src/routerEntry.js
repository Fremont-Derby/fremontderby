import { handleChallongePublishDryRunRequest } from './challongePublishHttp.js';
import { renderAdminPlayerStatsPage } from './adminPlayerStatsPage.js';
import { renderAdminRatingHealthPage } from './adminRatingHealthPage.js';
import { renderAdminSupportPage } from './adminSupportPage.js';
import { routeAdminSupport } from './adminSupportHttp.js';
import { runHourlyProbes, maybeCommentProbeFailures } from './hourlyProbe.js';
import { injectAccessibilityLayer } from './accessibilityLayer.js';
import { injectAdminGatewayTheme } from './adminGatewayTheme.js';
import { renderAdminPlayerContactPage } from './adminPlayerContactPage.js';
import { injectAdminSurfaceTheme } from './adminSurfaceTheme.js';
import { handleCreateAdminPlayerRequest } from './adminCreatePlayerHttp.js';
import { handleRecordRatingObservationRequest, handleRecomputeDerbyEstimateRequest } from './adminPlayersHttp.js';
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
import { routeSeasonLifecycle } from './seasonLifecycleHttp.js';
import { enhanceSeasonLifecycle } from './seasonLifecycleEnhancer.js';
import { enhanceSeasonPublishReadiness } from './seasonPublishReadinessEnhancer.js';
import { injectSiteStyles } from './siteStyles.js';
import { injectStandingsTheme } from './standingsTheme.js';
import { injectPublicSeo } from './publicSeo.js';
import { enhanceTeamsCanonicalActions } from './teamsCanonicalActionsEnhancer.js';
import { injectTeamsTheme } from './teamsTheme.js';
import { resolveDeployVersionTag } from './deployVersionTag.js';

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
  const withAuth = await injectPersistentAuthSession(mobileMenuAccessible);
  return injectPublicSeo(withAuth, pathname);
}

// Replaced at deploy time by scripts/stamp-deploy-identity.mjs
const STAMPED_DEPLOY_GIT_SHA = null;
const STAMPED_DEPLOY_AT = null;

export default {
  async scheduled(event, env, ctx) {
    const summary = await runHourlyProbes(env);
    const notify = await maybeCommentProbeFailures(env, summary);
    console.log(JSON.stringify({ type: 'hourly_probe', ok: summary.ok, failures: summary.failures.length, notify }));
    return summary;
  },

  async fetch(request, env, ctx) {
    // HEAD = same as GET without a body (CDN/monitors). Avoid recursive this.fetch.
    if (request.method === 'HEAD') {
      const getRequest = new Request(request.url, {
        method: 'GET',
        headers: request.headers,
        redirect: request.redirect,
      });
      const response = await this.fetch(getRequest, env, ctx);
      return new Response(null, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    }

    const url = new URL(request.url);
    // Authoritative deploy identity for canaries/smoke (CF metadata.tag is often empty).
    if ((url.pathname === '/health' || url.pathname === '/health/environment') && request.method === 'GET') {
      const meta = env.CF_VERSION_METADATA || {};
      const identity = resolveDeployVersionTag({
        meta,
        deployGitSha: env.DEPLOY_GIT_SHA,
        stampedSha: STAMPED_DEPLOY_GIT_SHA,
        stampedAt: STAMPED_DEPLOY_AT,
      });
      if (url.pathname === '/health') {
        return Response.json(
          {
            ok: true,
            service: 'fremontderby',
            version: identity.version,
            versionTag: identity.tag,
            deployedAt: identity.deployedAt,
            versionTagSource: identity.versionTagSource,
          },
          { headers: { 'cache-control': 'no-store' } },
        );
      }
      // environment: still use legacy readiness via fallthrough
    }
    if (url.pathname === '/internal/hourly-probe' && request.method === 'GET') {
      const key = request.headers.get('x-probe-key') || url.searchParams.get('key') || '';
      const expected = String(env?.HOURLY_PROBE_KEY || '').trim();
      const envName = String(env?.ENVIRONMENT || 'production').toLowerCase();
      // Production always requires a configured key; other lanes require key when set.
      if (envName === 'production' || expected) {
        if (!expected || key !== expected) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
      }
      const summary = await runHourlyProbes(env);
      if (url.searchParams.get('notify') === '1') {
        summary.notify = await maybeCommentProbeFailures(env, summary);
      }
      return Response.json(summary, { headers: { 'cache-control': 'no-store' } });
    }

    // Trades restored — paths served by legacy router / index handlers.



    if (url.pathname === '/admin/player-stats') {
      if (request.method !== 'GET') return Response.json({ error: 'Method not allowed' }, { status: 405 });
      return finalizeBrowserResponse(new Response(renderAdminPlayerStatsPage(), {
        headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
      }), url.pathname);
    }
if (url.pathname === '/admin/rating-health') {
      if (request.method !== 'GET') return Response.json({ error: 'Method not allowed' }, { status: 405 });
      return finalizeBrowserResponse(new Response(renderAdminRatingHealthPage(), {
        headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
      }), url.pathname);
    }
if (url.pathname === '/admin/support') {
      if (request.method !== 'GET') return Response.json({ error: 'Method not allowed' }, { status: 405 });
      return finalizeBrowserResponse(new Response(renderAdminSupportPage(), {
        headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
      }), url.pathname);
    }
if (url.pathname === '/admin/player-contact') {
      if (request.method !== 'GET') return Response.json({ error: 'Method not allowed' }, { status: 405 });
      return finalizeBrowserResponse(new Response(renderAdminPlayerContactPage(), {
        headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
      }), url.pathname);
    }

    {

    {
      const recompute = url.pathname.match(/^\/api\/admin\/players\/([^/]+)\/recompute-derby-estimate$/);
      if (recompute && request.method === 'POST') {
        return finalizeBrowserResponse(
          await handleRecomputeDerbyEstimateRequest(request, env, decodeURIComponent(recompute[1])),
          url.pathname,
        );
      }
    }

      const ratingObs = url.pathname.match(/^\/api\/admin\/players\/([^/]+)\/rating-observation$/);
      if (ratingObs && request.method === 'POST') {
        return finalizeBrowserResponse(
          await handleRecordRatingObservationRequest(request, env, decodeURIComponent(ratingObs[1])),
          url.pathname,
        );
      }
    }

    if (url.pathname === '/api/admin/challonge/publish-candidate-a' && request.method === 'POST') {
      return finalizeBrowserResponse(
        await handleChallongePublishDryRunRequest(request, env),
        url.pathname,
      );
    }
if (url.pathname === '/api/admin/players' && request.method === 'POST') return finalizeBrowserResponse(await handleCreateAdminPlayerRequest(request, env), url.pathname);
    const playerClaimResponse = await routePlayerClaim(request, env);
    if (playerClaimResponse) return finalizeBrowserResponse(playerClaimResponse, url.pathname);
    const adminSupportResponse = await routeAdminSupport(request, env);
    if (adminSupportResponse) return finalizeBrowserResponse(adminSupportResponse, url.pathname);
    const playerContactResponse = await routePlayerContact(request, env);
    if (playerContactResponse) return finalizeBrowserResponse(playerContactResponse, url.pathname);
    const playerSeasonRegistrationResponse = await routePlayerSeasonRegistration(request, env);
    if (playerSeasonRegistrationResponse) return finalizeBrowserResponse(playerSeasonRegistrationResponse, url.pathname);
    const dateAvailabilityResponse = await routeDateAvailability(request, env);
    if (dateAvailabilityResponse) return finalizeBrowserResponse(dateAvailabilityResponse, url.pathname);
    const seasonCloseResponse = await routeSeasonClose(request, env);
    if (seasonCloseResponse) return finalizeBrowserResponse(seasonCloseResponse, url.pathname);
    const seasonLifecycleResponse = await routeSeasonLifecycle(request, env);
    if (seasonLifecycleResponse) return finalizeBrowserResponse(seasonLifecycleResponse, url.pathname);
    const adminGatewayResponse = routeAdminGateway(request);
    if (adminGatewayResponse) return finalizeBrowserResponse(adminGatewayResponse, url.pathname);
    const adminSeasonTeamsResponse = await routeAdminSeasonTeams(request, env);
    if (adminSeasonTeamsResponse) return finalizeBrowserResponse(adminSeasonTeamsResponse, url.pathname);
    const response = await legacyRouter.fetch(request, env, ctx);
    const reconciled = await reconcileProductShell(response, url.pathname);
    if (url.pathname === '/schedule' && request.method === 'GET') return finalizeBrowserResponse(await enhanceScheduleAvailability(reconciled), url.pathname);
    if (url.pathname === '/teams' && request.method === 'GET') return finalizeBrowserResponse(await enhanceTeamsCanonicalActions(reconciled), url.pathname);
    if (url.pathname === '/admin/seasons' && request.method === 'GET') return finalizeBrowserResponse(await enhanceSeasonLifecycle(reconciled), url.pathname);
    if (url.pathname === '/season-setup' && request.method === 'GET') {
      const withPublishReadiness = await enhanceSeasonPublishReadiness(reconciled);
      const withClose = await enhanceSeasonClose(withPublishReadiness);
      return finalizeBrowserResponse(await enhanceSeasonLifecycle(withClose), url.pathname);
    }
    if (url.pathname === '/profile' && request.method === 'GET') {
      const withSeasonRegistration = await enhanceProfileSeasonRegistration(reconciled);
      const withContact = await enhanceProfileContact(withSeasonRegistration);
      return finalizeBrowserResponse(await enhanceProfilePlayerClaim(withContact), url.pathname);
    }
    return finalizeBrowserResponse(reconciled, url.pathname);
  },
};
