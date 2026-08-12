import legacyRouter from './router.js';
import { routeAdminSeasonTeams } from './adminSeasonTeamsRouter.js';

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
    const moderationLink = '<a href="/messages/moderation">Moderation</a>';
    const seasonTeamsLink = '<a href="/admin/season-teams">Season teams</a>';
    html = html.replace(moderationLink, seasonTeamsLink + moderationLink);
  }

  html = html.replaceAll('>Demo</a>', '>Test Drive the App</a>');

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

export default {
  async fetch(request, env, ctx) {
    const adminSeasonTeamsResponse = await routeAdminSeasonTeams(request, env);
    if (adminSeasonTeamsResponse) return adminSeasonTeamsResponse;
    const response = await legacyRouter.fetch(request, env, ctx);
    return reconcileProductShell(response, new URL(request.url).pathname);
  },
};
