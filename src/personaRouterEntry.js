import baseRouterEntry from './routerEntry.js';
import { decorateHtmlWithShell } from './appShell.js';
import { decorateJflModernShell } from './jflModernShell.js';
import { routeJflSeasonSchedule } from './jflSeasonScheduleHttp.js';
import { routeJflSeasonPublicReads } from './jflSeasonPublicReadsHttp.js';
import { routeJflMeNotifications } from './jflMeNotificationsHttp.js';
import { renderFreeAgentsPage } from './freeAgentsPage.js';
import { renderPracticePage } from './practicePage.js';
import { applyJflRegistrationNav } from './jflRegistrationNav.js';
import { applyJflPrizesAutoloadFix } from './jflPrizesAutoloadFix.js';
import { enhanceFinishedScheduleBreakdown } from './finishedScheduleEnhancer.js';
import { injectTestPersonaControls } from './testPersonaEnhancer.js';
import { routeTestPersona } from './testPersonaHttp.js';
import { testPersonaEnabled } from './testPersona.js';

const FREE_AGENT_PAGES = new Set(['/free-agents', '/free-agents/', '/fa', '/free-agent', '/freeagent', '/substitutes', '/subs']);
const PRACTICE_PAGES = new Set(['/practice', '/practice/', '/practices']);
const AUTOLOAD_PAGES = new Set(['/prizes', '/prizes/', '/standings', '/standings/']);

function htmlPage(render, pathname, request, env) {
  const html = decorateHtmlWithShell(render(), pathname);
  const response = new Response(html, {
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  });
  return decorateJflModernShell(response, request, env);
}

export default {
  ...baseRouterEntry,

  async fetch(request, env, ctx) {
    const personaResponse = await routeTestPersona(request, env);
    if (personaResponse) return personaResponse;

    const url = new URL(request.url);
    if (FREE_AGENT_PAGES.has(url.pathname) && request.method === 'GET') {
      return htmlPage(renderFreeAgentsPage, '/free-agents', request, env);
    }
    if (PRACTICE_PAGES.has(url.pathname) && request.method === 'GET') {
      return htmlPage(renderPracticePage, '/practice', request, env);
    }

    const scheduleResponse = await routeJflSeasonSchedule(request, env);
    if (scheduleResponse) return scheduleResponse;

    const publicReadResponse = await routeJflSeasonPublicReads(request, env);
    if (publicReadResponse) return publicReadResponse;

    const notificationsResponse = await routeJflMeNotifications(request, env);
    if (notificationsResponse?.rewrite) {
      request = notificationsResponse.rewrite;
    } else if (notificationsResponse) {
      return notificationsResponse;
    }

    let response = await baseRouterEntry.fetch(request, env, ctx);
    response = await enhanceFinishedScheduleBreakdown(response);
    response = await applyJflRegistrationNav(response);
    if (AUTOLOAD_PAGES.has(url.pathname)) {
      response = await applyJflPrizesAutoloadFix(response);
    }
    if (!testPersonaEnabled(env)) return response;
    return injectTestPersonaControls(response);
  },
};
