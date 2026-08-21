import baseRouterEntry from './routerEntry.js';
import { injectTestPersonaControls } from './testPersonaEnhancer.js';
import { routeTestPersona } from './testPersonaHttp.js';
import { testPersonaEnabled } from './testPersona.js';

export default {
  ...baseRouterEntry,

  async fetch(request, env, ctx) {
    const personaResponse = await routeTestPersona(request, env);
    if (personaResponse) return personaResponse;

    const response = await baseRouterEntry.fetch(request, env, ctx);
    if (!testPersonaEnabled(env)) return response;
    return injectTestPersonaControls(response);
  },
};
