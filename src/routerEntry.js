import { handleCreateAdminPlayerRequest } from './adminCreatePlayerHttp.js';
import { routeAdminGateway } from './adminGatewayRouter.js';
import { routeDateAvailability } from './dateAvailabilityHttp.js';
import { injectDesignSystem } from './designSystem.js';
import legacyRouter from './router.js';
import { routeAdminSeasonTeams } from './adminSeasonTeamsRouter.js';
import { injectPersistentAuthSession } from './persistentAuthSession.js';
import { routePlayerClaim } from './playerClaimHttp.js';
import { routePlayerContact } from './playerContactHttp.js';
import { enhanceProfileContact } from './profileContactEnhancer.js';
import { enhanceProfilePlayerClaim } from './profilePlayerClaimEnhancer.js';
import { enhanceProfileSeasonRegistration } from './profileSeasonRegistrationEnhancer.js';
import { routePlayerSeasonRegistration } from './playerSeasonRegistrationHttp.js';
import { enhanceScheduleAvailability } from './scheduleAvailabilityEnhancer.js';
import { enhanceTeamsCanonicalActions } from './teamsCanonicalActionsEnhancer.js';

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

  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function finalizeBrowserResponse(response) {
  const designed = await injectDesignSystem(response);
  return injectPersistentAuthSession(designed);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/api/admin/players' && request.method === 'POST') {
      return finalizeBrowserResponse(await handleCreateAdminPlayerRequest(request, env));
    }
    const playerClaimResponse = await routePlayerClaim(request, env);
    if (playerClaimResponse) return finalizeBrowserResponse(playerClaimResponse);
    const playerContactResponse = await routePlayerContact(request, env);
    if (playerContactResponse) return finalizeBrowserResponse(playerContactResponse);
    const playerSeasonRegistrationResponse = await routePlayerSeasonRegistration(request, env);
    if (playerSeasonRegistrationResponse) return finalizeBrowserResponse(playerSeasonRegistrationResponse);
    const dateAvailabilityResponse = await routeDateAvailability(request, env);
    if (dateAvailabilityResponse) return finalizeBrowserResponse(dateAvailabilityResponse);
    const adminGatewayResponse = routeAdminGateway(request);
    if (adminGatewayResponse) return finalizeBrowserResponse(adminGatewayResponse);
    const adminSeasonTeamsResponse = await routeAdminSeasonTeams(request, env);
    if (adminSeasonTeamsResponse) return finalizeBrowserResponse(adminSeasonTeamsResponse);
    const response = await legacyRouter.fetch(request, env, ctx);
    const reconciled = await reconcileProductShell(response, url.pathname);
    if (url.pathname === '/schedule' && request.method === 'GET') {
      return finalizeBrowserResponse(await enhanceScheduleAvailability(reconciled));
    }
    if (url.pathname === '/teams' && request.method === 'GET') {
      return finalizeBrowserResponse(await enhanceTeamsCanonicalActions(reconciled));
    }
    if (url.pathname === '/profile' && request.method === 'GET') {
      const withSeasonRegistration = await enhanceProfileSeasonRegistration(reconciled);
      const withContact = await enhanceProfileContact(withSeasonRegistration);
      return finalizeBrowserResponse(await enhanceProfilePlayerClaim(withContact));
    }
    return finalizeBrowserResponse(reconciled);
  },
};
