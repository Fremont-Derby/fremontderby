import baseRouterEntry from './routerEntry.js';
import { decorateHtmlWithShell } from './appShell.js';
import { decorateJflModernShell } from './jflModernShell.js';
import { routeJflSeasonSchedule } from './jflSeasonScheduleHttp.js';
import { routeJflSeasonPublicReads } from './jflSeasonPublicReadsHttp.js';
import { routeJflMeNotifications } from './jflMeNotificationsHttp.js';
import { renderFreeAgentsPage } from './freeAgentsPage.js';
import { renderPracticePage } from './practicePage.js';
import { renderPlayoffsPage } from './playoffsPage.js';
import { renderPlayersDirectoryPage } from './playersDirectoryPage.js';
import { renderNotificationsPage } from './notificationsPage.js';
import { applyJflRegistrationNav } from './jflRegistrationNav.js';
import { applyJflPrizesAutoloadFix } from './jflPrizesAutoloadFix.js';
import { applyJflChatScrollFix } from './jflChatScrollFix.js';
import { enhanceFinishedScheduleBreakdown } from './finishedScheduleEnhancer.js';
import { injectTestPersonaControls } from './testPersonaEnhancer.js';
import { routeTestPersona } from './testPersonaHttp.js';
import { testPersonaEnabled } from './testPersona.js';

const FREE_AGENT_PAGES = new Set(['/free-agents', '/free-agents/', '/fa', '/free-agent', '/freeagent', '/substitutes', '/subs']);
const PRACTICE_PAGES = new Set(['/practice', '/practice/', '/practices']);
const PLAYOFF_PAGES = new Set(['/playoffs', '/playoffs/', '/playoff', '/bracket', '/brackets']);
const PLAYER_PAGES = new Set(['/players', '/players/', '/player', '/directory']);
const NOTIFICATION_PAGES = new Set(['/notifications', '/notifications/', '/notify']);
const CHECKIN_PAGES = new Set(['/check-in', '/check-in/', '/checkin', '/league-night', '/leaguenight', '/ready-check', '/readycheck']);
const AUTOLOAD_PAGES = new Set(['/prizes', '/prizes/', '/standings', '/standings/']);
const MESSAGE_PAGES = new Set(['/messages', '/messages/']);

const LIVE_PAGE_REWRITES = new Map([
  ['/inbox', '/messages'],
  ['/chat', '/messages'],
  ['/msg', '/messages'],
  ['/msgs', '/messages'],
  ['/venues', '/rules'],
  ['/help', '/rules'],
  ['/faq', '/rules'],
  ['/support', '/rules'],
  ['/contact', '/rules'],
  ['/account', '/profile'],
  ['/settings', '/profile'],
  ['/me', '/profile'],
  ['/login', '/profile'],
  ['/signin', '/profile'],
  ['/sign-in', '/profile'],
  ['/signup', '/profile'],
  ['/sign-up', '/profile'],
  ['/register', '/profile'],
  ['/registration', '/profile'],
  ['/scoring', '/scorecard'],
  ['/score', '/scorecard'],
  ['/scores', '/scorecard'],
  ['/scorecards', '/scorecard'],
  ['/awards', '/prizes'],
  ['/prize', '/prizes'],
  ['/stats', '/standings'],
  ['/history', '/standings'],
  ['/tonight', '/schedule'],
  ['/week', '/schedule'],
  ['/this-week', '/schedule'],
  ['/schedules', '/schedule'],
  ['/matches', '/schedule'],
  ['/match', '/schedule'],
  ['/rounds', '/schedule'],
  ['/round', '/schedule'],
  ['/season', '/schedule'],
  ['/seasons', '/schedule'],
  ['/roster', '/teams'],
  ['/join', '/teams'],
  ['/apply', '/teams'],
  ['/captain', '/teams'],
  ['/captains', '/teams'],
  ['/lineups', '/lineup'],
  ['/sandbox', '/demo'],
  ['/try', '/demo'],
  ['/testdrive', '/demo'],
  ['/test-drive', '/demo'],
  ['/home', '/'],
  ['/dashboard', '/'],
  ['/app', '/'],
]);

function htmlPage(render, pathname, request, env) {
  const html = decorateHtmlWithShell(render(), pathname);
  const response = new Response(html, {
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  });
  return decorateJflModernShell(response, request, env);
}

function stripTrailingSlash(pathname) {
  return pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

export default {
  ...baseRouterEntry,

  async fetch(request, env, ctx) {
    const personaResponse = await routeTestPersona(request, env);
    if (personaResponse) return personaResponse;

    let url = new URL(request.url);
    if (FREE_AGENT_PAGES.has(url.pathname) && request.method === 'GET') {
      return htmlPage(renderFreeAgentsPage, '/free-agents', request, env);
    }
    if (PRACTICE_PAGES.has(url.pathname) && request.method === 'GET') {
      return htmlPage(renderPracticePage, '/practice', request, env);
    }
    if (PLAYOFF_PAGES.has(url.pathname) && request.method === 'GET') {
      return htmlPage(renderPlayoffsPage, '/playoffs', request, env);
    }
    if (PLAYER_PAGES.has(url.pathname) && request.method === 'GET') {
      return htmlPage(renderPlayersDirectoryPage, '/players', request, env);
    }
    if (NOTIFICATION_PAGES.has(url.pathname) && request.method === 'GET') {
      return htmlPage(renderNotificationsPage, '/notifications', request, env);
    }
    if (CHECKIN_PAGES.has(url.pathname) && request.method === 'GET') {
      const rewritten = new URL(request.url);
      rewritten.pathname = '/availability';
      request = new Request(rewritten, request);
      url = rewritten;
    } else {
      const canonical = LIVE_PAGE_REWRITES.get(stripTrailingSlash(url.pathname));
      if (canonical && request.method === 'GET') {
        const rewritten = new URL(request.url);
        rewritten.pathname = canonical;
        request = new Request(rewritten, request);
        url = rewritten;
      }
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
    if (MESSAGE_PAGES.has(url.pathname)) {
      response = await applyJflChatScrollFix(response);
    }
    if (!testPersonaEnabled(env)) return response;
    return injectTestPersonaControls(response);
  },
};
