import { routeRequestPartA } from './indexRouteA.js';
import { routeRequestPartB } from './indexRouteB.js';

export default {
  async fetch(request, env) {
    return (await routeRequestPartA(request, env)) ?? (await routeRequestPartB(request, env));
  },
};
