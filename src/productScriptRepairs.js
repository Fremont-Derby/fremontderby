import { repairAdminPlayersScript } from './adminPlayersScriptRepair.js';
import { repairAvailabilityScript } from './availabilityScriptRepair.js';
import { repairAdminSeasonTeamsScript } from './adminSeasonTeamsScriptRepair.js';
import { repairLineupScript } from './lineupScriptRepair.js';
import { repairStandingsPageScript } from './standingsScriptRepair.js';

export async function applyProductScriptRepairs(response, pathname) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;
  let html = await response.text();
  if (pathname === '/standings') html = repairStandingsPageScript(html);
  if (pathname === '/admin/players') html = repairAdminPlayersScript(html);
  if (pathname === '/availability') html = repairAvailabilityScript(html);
  if (pathname === '/admin/season-teams') html = repairAdminSeasonTeamsScript(html);
  if (pathname === '/lineup') html = repairLineupScript(html);
  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}
