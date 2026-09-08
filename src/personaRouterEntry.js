import baseRouterEntry from './routerEntry.js';
import { routeJflSeasonSchedule } from './jflSeasonScheduleHttp.js';
import { enhanceFinishedScheduleBreakdown } from './finishedScheduleEnhancer.js';
import { routeQaMissionCampaign } from './qaMissionCampaign.js';
import { routeQaScorecard } from './qaScorecardRouteEnhancer.js';
import { enhanceQaResultUx } from './qaResultUxEnhancer.js';
import { injectTestPersonaControls } from './testPersonaEnhancer.js';
import { routeTestPersona } from './testPersonaHttp.js';
import { testPersonaEnabled } from './testPersona.js';

export default {
  ...baseRouterEntry,

  async fetch(request, env, ctx) {
    const qaMissionResponse = routeQaMissionCampaign(request, env);
    if (qaMissionResponse) return qaMissionResponse;

    const qaScorecardResponse = await routeQaScorecard(request, env);
    if (qaScorecardResponse) return enhanceQaResultUx(qaScorecardResponse, request, env);

    const personaResponse = await routeTestPersona(request, env);
    if (personaResponse) return personaResponse;

    const scheduleResponse = await routeJflSeasonSchedule(request, env);
    if (scheduleResponse) return scheduleResponse;

    let response = await baseRouterEntry.fetch(request, env, ctx);
    response = await enhanceFinishedScheduleBreakdown(response);
    if (!testPersonaEnabled(env)) return response;
    return injectTestPersonaControls(response);
  },
};
