import baseRouterEntry from './routerEntry.js';
import { routeJflSeasonSchedule } from './jflSeasonScheduleHttp.js';
import { routeJflSeasonPublicReads } from './jflSeasonPublicReadsHttp.js';
import { renderFreeAgentsPage } from './freeAgentsPage.js';
import { applyJflRegistrationNav } from './jflRegistrationNav.js';
import { enhanceFinishedScheduleBreakdown } from './finishedScheduleEnhancer.js';
import { injectTestPersonaControls } from './testPersonaEnhancer.js';
import { routeTestPersona } from './testPersonaHttp.js';
import { testPersonaEnabled } from './testPersona.js';

export default {
  ...baseRouterEntry,

  async fetch(request, env, ctx) {
    const personaResponse = await routeTestPersona(request, env);
    if (personaResponse) return personaResponse;

    const url = new URL(request.url);
    if ((url.pathname === '/free-agents' || url.pathname === '/free-agents/') && request.method === 'GET') {
      return new Response(renderFreeAgentsPage(), {
        headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
      });
    }

    const scheduleResponse = await routeJflSeasonSchedule(request, env);
    if (scheduleResponse) return scheduleResponse;

    const publicReadResponse = await routeJflSeasonPublicReads(request, env);
    if (publicReadResponse) return publicReadResponse;

    let response = await baseRouterEntry.fetch(request, env, ctx);
    response = await enhanceFinishedScheduleBreakdown(response);
    response = await applyJflRegistrationNav(response);
    if (!testPersonaEnabled(env)) return response;
    return injectTestPersonaControls(response);
  },
};
