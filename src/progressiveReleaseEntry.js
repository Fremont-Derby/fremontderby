import routerEntry from './routerEntry.js';
import { progressiveReleaseGateResponse } from './progressiveReleaseGate.js';

export default {
  async fetch(request, env, ctx) {
    const gated = progressiveReleaseGateResponse(request, env);
    if (gated) return gated;
    return routerEntry.fetch(request, env, ctx);
  },

  async scheduled(event, env, ctx) {
    return routerEntry.scheduled(event, env, ctx);
  },
};
