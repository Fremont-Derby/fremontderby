import legacyRouter from './router.js';
import { routeAdminSeasonTeams } from './adminSeasonTeamsRouter.js';

async function addSeasonTeamsLink(response, pathname) {
  if (pathname !== '/season-setup') return response;
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;
  const headers = new Headers(response.headers);
  const html = await response.text();
  const link = '<p style="margin:12px 0"><a href="/admin/season-teams" style="display:inline-flex;min-height:48px;align-items:center;padding:0 16px;border-radius:10px;background:#43bd7d;color:#07110b;font-weight:900;text-decoration:none">Manage season teams</a></p>';
  return new Response(html.replace('</main>', link + '</main>'), {
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
    return addSeasonTeamsLink(response, new URL(request.url).pathname);
  },
};
