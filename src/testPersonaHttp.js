import { AuthError, authenticateSupabaseUser } from './supabaseAuth.js';
import {
  TEST_PERSONA_COOKIE,
  clearTestPersonaCookieHeader,
  findTestPersona,
  isTestPersonaOperator,
  listTestPersonas,
  selectedTestPersonaKey,
  testPersonaCookieHeader,
  testPersonaEnabled,
} from './testPersona.js';

function noStore(body, status = 200, headers = {}) {
  return Response.json(body, {
    status,
    headers: {
      'cache-control': 'no-store, max-age=0',
      ...headers,
    },
  });
}

function notFound() {
  return noStore({ error: 'Not found' }, 404);
}

function hasBearerToken(request) {
  return /^Bearer\s+.+$/i.test(request.headers.get('authorization') || '');
}

function withoutPersonaCookie(request) {
  const headers = new Headers(request.headers);
  const cookie = headers.get('cookie') || '';
  const kept = cookie
    .split(';')
    .map((pair) => pair.trim())
    .filter(Boolean)
    .filter((pair) => pair.split('=', 1)[0] !== TEST_PERSONA_COOKIE);
  if (kept.length) headers.set('cookie', kept.join('; '));
  else headers.delete('cookie');
  return new Request(request, { headers });
}

export async function routeTestPersona(
  request,
  env,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  const url = new URL(request.url);
  if (url.pathname !== '/api/test-persona') return null;

  // Production, DRU, staging, missing, and unknown runtime identities all fail
  // closed before any authentication or actor lookup occurs.
  if (!testPersonaEnabled(env)) return notFound();

  if (!['GET', 'POST', 'DELETE'].includes(request.method)) {
    return noStore({ error: 'Method not allowed' }, 405);
  }

  // Tokenless JFL beta automation is intentionally excluded. A tester must
  // have an explicit JFL simulated-OIDC session or a real Supabase bearer user.
  if (!hasBearerToken(request)) return noStore({ error: 'Missing bearer token' }, 401);

  try {
    const operator = await authenticateSupabaseUser(withoutPersonaCookie(request), env, { fetch: fetchImpl });
    if (!isTestPersonaOperator(operator, env)) {
      return noStore({ error: 'Test persona access is not enabled for this account' }, 403);
    }

    if (request.method === 'GET') {
      const currentKey = selectedTestPersonaKey(request, env);
      const current = currentKey ? findTestPersona(currentKey) : null;
      return noStore({
        environment: String(env.ENVIRONMENT || '').trim().toLowerCase(),
        current,
        personas: listTestPersonas(env),
      });
    }

    if (request.method === 'DELETE') {
      return noStore(
        { ok: true, current: null },
        200,
        { 'set-cookie': clearTestPersonaCookieHeader() },
      );
    }

    const body = await request.json().catch(() => ({}));
    const key = typeof body?.persona === 'string' ? body.persona.trim() : '';
    const persona = findTestPersona(key);
    if (!persona) return noStore({ error: 'Unknown test persona' }, 400);
    const cookie = testPersonaCookieHeader(key, env);
    if (!cookie) return notFound();

    console.log(JSON.stringify({
      type: 'test_persona_assumed',
      environment: String(env.ENVIRONMENT || '').trim().toLowerCase(),
      operatorUserId: operator.id,
      persona: key,
    }));

    return noStore(
      { ok: true, current: persona },
      200,
      { 'set-cookie': cookie },
    );
  } catch (error) {
    if (error instanceof AuthError) return noStore({ error: error.message }, error.status);
    console.error('test persona route failed', error);
    return noStore({ error: 'Test persona request failed' }, 500);
  }
}
