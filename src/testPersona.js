const ENABLED_ENVIRONMENTS = new Set(['jfl', 'gamma']);

export const TEST_PERSONAS = Object.freeze([
  Object.freeze({ key: 'admin-no-team', label: 'Admin — no team' }),
  Object.freeze({ key: 'admin-captain', label: 'Admin Captain' }),
  Object.freeze({ key: 'regular-captain', label: 'Regular Captain' }),
  Object.freeze({ key: 'player-a', label: 'Player A' }),
  Object.freeze({ key: 'player-b', label: 'Player B' }),
]);

const PERSONA_BY_KEY = new Map(TEST_PERSONAS.map((persona) => [persona.key, persona]));

const PERSONA_ACTOR_IDS = Object.freeze({
  jfl: Object.freeze({
    'admin-no-team': '18580000-0000-4000-8000-000000000001',
    'admin-captain': '18580000-0000-4000-8000-000000000002',
    'regular-captain': '18580000-0000-4000-8000-000000000003',
    'player-a': '18580000-0000-4000-8000-000000000004',
    'player-b': '18580000-0000-4000-8000-000000000005',
  }),
  gamma: Object.freeze({
    'admin-no-team': '18580000-0000-4001-8000-000000000001',
    'admin-captain': '18580000-0000-4001-8000-000000000002',
    'regular-captain': '18580000-0000-4001-8000-000000000003',
    'player-a': '18580000-0000-4001-8000-000000000004',
    'player-b': '18580000-0000-4001-8000-000000000005',
  }),
});

export const TEST_PERSONA_COOKIE = 'fd_test_persona';

function environmentName(env = {}) {
  return String(env.ENVIRONMENT || '').trim().toLowerCase();
}

export function testPersonaEnabled(env = {}) {
  return ENABLED_ENVIRONMENTS.has(environmentName(env));
}

export function listTestPersonas(env = {}) {
  return testPersonaEnabled(env) ? TEST_PERSONAS : [];
}

export function findTestPersona(key) {
  return PERSONA_BY_KEY.get(String(key || '').trim()) || null;
}

function configuredOperatorIds(env = {}) {
  return new Set(
    String(env.TEST_PERSONA_OPERATOR_USER_IDS || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
  );
}

export function isTestPersonaOperator(user, env = {}) {
  if (!testPersonaEnabled(env) || !user?.id) return false;
  const allowlist = configuredOperatorIds(env);
  if (allowlist.size === 0 || !allowlist.has(String(user.id))) return false;

  // Tokenless JFL/DRU beta automation is never allowed to impersonate. The
  // explicit JFL simulated Google/OIDC browser session is an approved signed-in
  // tester path and carries one of these markers in addition to betaBypass.
  if (user.betaBypass && !user.jflSimulatedGoogle && !user.simulatedOidc) return false;
  return true;
}

function cookieValue(request, name) {
  const cookie = request?.headers?.get?.('cookie') || '';
  for (const pair of cookie.split(';')) {
    const [rawName, ...rawValue] = pair.trim().split('=');
    if (rawName === name) return decodeURIComponent(rawValue.join('='));
  }
  return '';
}

export function selectedTestPersonaKey(request, env = {}) {
  if (!testPersonaEnabled(env)) return null;
  const currentEnvironment = environmentName(env);
  const value = cookieValue(request, TEST_PERSONA_COOKIE);
  const separator = value.indexOf(':');
  if (separator < 0) return null;
  const cookieEnvironment = value.slice(0, separator);
  const key = value.slice(separator + 1);
  if (cookieEnvironment !== currentEnvironment || !findTestPersona(key)) return null;
  return key;
}

export function resolveTestPersonaActor(request, env = {}, operator) {
  if (!isTestPersonaOperator(operator, env)) return null;
  const key = selectedTestPersonaKey(request, env);
  if (!key) return null;
  const currentEnvironment = environmentName(env);
  const persona = findTestPersona(key);
  const id = PERSONA_ACTOR_IDS[currentEnvironment]?.[key] || null;
  if (!id || !persona) return null;
  return {
    id,
    email: `${key}@${currentEnvironment}.persona.invalid`,
    testPersona: {
      key: persona.key,
      label: persona.label,
      environment: currentEnvironment,
    },
    operatorUserId: operator.id,
  };
}

export function testPersonaCookieHeader(key, env = {}) {
  const currentEnvironment = environmentName(env);
  if (!testPersonaEnabled(env) || !findTestPersona(key)) return null;
  const value = encodeURIComponent(`${currentEnvironment}:${key}`);
  return `${TEST_PERSONA_COOKIE}=${value}; Path=/; Max-Age=28800; HttpOnly; Secure; SameSite=Strict`;
}

export function clearTestPersonaCookieHeader() {
  return `${TEST_PERSONA_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;
}

export function personaActorId(environment, key) {
  return PERSONA_ACTOR_IDS[String(environment || '').trim().toLowerCase()]?.[key] || null;
}
