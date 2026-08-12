import legacyRouter from './legacyRouter.js';
import { routeAdminSeasonTeams } from './adminSeasonTeamsRouter.js';

export default {
  async fetch(request, env, ctx) {
    const adminSeasonTeamsResponse = await routeAdminSeasonTeams(request, env);
    if (adminSeasonTeamsResponse) return adminSeasonTeamsResponse;
    return legacyRouter.fetch(request, env, ctx);
  },
};
