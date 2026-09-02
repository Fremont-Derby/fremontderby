import baseRouterEntry from './routerEntry.js';
import { decorateHtmlWithShell } from './appShell.js';
import { decorateJflModernShell } from './jflModernShell.js';
import { routeJflSeasonSchedule } from './jflSeasonScheduleHttp.js';
import { renderPlayersDirectoryPage } from './playersDirectoryPage.js';
import { enhanceFinishedScheduleBreakdown } from './finishedScheduleEnhancer.js';
import { injectTestPersonaControls } from './testPersonaEnhancer.js';
import { routeTestPersona } from './testPersonaHttp.js';
import { testPersonaEnabled } from './testPersona.js';

const PLAYER_PAGES = new Set(['/players', '/players/', '/player']);

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
    if (PLAYER_PAGES.has(url.pathname) && request.method === 'GET') {
      return htmlPage(renderPlayersDirectoryPage, '/players', request, env);
    }

    const scheduleResponse = await routeJflSeasonSchedule(request, env);
    if (scheduleResponse) return scheduleResponse;

    let response = await baseRouterEntry.fetch(request, env, ctx);
    response = await enhanceFinishedScheduleBreakdown(response);
    if (!testPersonaEnabled(env)) return response;
    return injectTestPersonaControls(response);
  },
};
