import { fileURLToPath } from 'node:url';

export const DRU_WORKER_SCRIPT_NAME = 'fremontderby-dru';

export const DRU_OVERRIDE_SECRET_NAMES = Object.freeze([
  'SUPABASE_URL',
  'SUPABASE_PUBLISHABLE_KEY',
  'EXPECTED_SUPABASE_PROJECT_REF',
]);

export const DRU_PRESERVE_SECRET_NAMES = Object.freeze([
  'SUPABASE_SERVICE_ROLE_KEY',
  'BETA_ACTOR_USER_ID',
]);

function requireValue(value, name) {
  const normalized = String(value || '').trim();
  if (!normalized) throw new Error(`${name} is required.`);
  return normalized;
}

function apiError(payload, response) {
  const messages = payload?.errors
    ?.map((error) => error?.message)
    .filter(Boolean)
    .join('; ');
  return messages || `HTTP ${response.status}`;
}

async function responsePayload(response, label) {
  try {
    return await response.json();
  } catch {
    throw new Error(`Cloudflare returned a non-JSON response for ${label}.`);
  }
}

export function secretsUrl({ accountId, scriptName, secretName }) {
  const parts = [
    'https://api.cloudflare.com/client/v4/accounts',
    encodeURIComponent(accountId),
    'workers/scripts',
    encodeURIComponent(scriptName),
    'secrets',
  ];
  if (secretName) parts.push(encodeURIComponent(secretName));
  return parts.join('/');
}

export function assertSafeDeleteTarget({ scriptName, secretName }) {
  if (scriptName !== DRU_WORKER_SCRIPT_NAME) {
    throw new Error(`Refusing secret mutation on ${scriptName}; only ${DRU_WORKER_SCRIPT_NAME} is allowed.`);
  }
  if (DRU_PRESERVE_SECRET_NAMES.includes(secretName)) {
    throw new Error(`Refusing to delete preserved DRU secret ${secretName}.`);
  }
  if (!DRU_OVERRIDE_SECRET_NAMES.includes(secretName)) {
    throw new Error(`Refusing to delete unlisted secret ${secretName}.`);
  }
}

export async function listWorkerSecrets({
  accountId,
  apiToken,
  scriptName = DRU_WORKER_SCRIPT_NAME,
  fetchImpl = fetch,
}) {
  const account = requireValue(accountId, 'CLOUDFLARE_ACCOUNT_ID');
  const token = requireValue(apiToken, 'CLOUDFLARE_API_TOKEN');
  const worker = requireValue(scriptName, 'Worker script name');
  if (worker !== DRU_WORKER_SCRIPT_NAME) {
    throw new Error(`Refusing secret list on ${worker}; only ${DRU_WORKER_SCRIPT_NAME} is allowed.`);
  }

  const response = await fetchImpl(secretsUrl({ accountId: account, scriptName: worker }), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  const payload = await responsePayload(response, `${worker} secret list`);
  if (!response.ok || payload?.success !== true) {
    throw new Error(`Could not list secrets for ${worker}: ${apiError(payload, response)}.`);
  }

  const rows = Array.isArray(payload.result) ? payload.result : [];
  return Object.freeze(rows.map((row) => String(row?.name || '')).filter(Boolean));
}

export async function deleteWorkerSecret({
  accountId,
  apiToken,
  scriptName = DRU_WORKER_SCRIPT_NAME,
  secretName,
  fetchImpl = fetch,
}) {
  const account = requireValue(accountId, 'CLOUDFLARE_ACCOUNT_ID');
  const token = requireValue(apiToken, 'CLOUDFLARE_API_TOKEN');
  const worker = requireValue(scriptName, 'Worker script name');
  const name = requireValue(secretName, 'Secret name');
  assertSafeDeleteTarget({ scriptName: worker, secretName: name });

  const response = await fetchImpl(
    secretsUrl({ accountId: account, scriptName: worker, secretName: name }),
    {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
  );
  const payload = await responsePayload(response, `${worker} secret ${name}`);

  if (response.status === 404) {
    return Object.freeze({ scriptName: worker, secretName: name, status: 'absent' });
  }
  if (!response.ok || payload?.success !== true) {
    throw new Error(`Could not delete ${name} on ${worker}: ${apiError(payload, response)}.`);
  }
  return Object.freeze({ scriptName: worker, secretName: name, status: 'deleted' });
}

export async function clearDruOverrideSecrets({
  accountId,
  apiToken,
  fetchImpl = fetch,
} = {}) {
  requireValue(accountId, 'CLOUDFLARE_ACCOUNT_ID');
  requireValue(apiToken, 'CLOUDFLARE_API_TOKEN');

  const before = await listWorkerSecrets({ accountId, apiToken, fetchImpl });
  const results = [];
  for (const secretName of DRU_OVERRIDE_SECRET_NAMES) {
    if (!before.includes(secretName)) {
      results.push({
        scriptName: DRU_WORKER_SCRIPT_NAME,
        secretName,
        status: 'absent',
      });
      continue;
    }
    results.push(await deleteWorkerSecret({
      accountId,
      apiToken,
      secretName,
      fetchImpl,
    }));
  }

  const after = await listWorkerSecrets({ accountId, apiToken, fetchImpl });
  const remaining = DRU_OVERRIDE_SECRET_NAMES.filter((name) => after.includes(name));
  if (remaining.length > 0) {
    throw new Error(`Override secrets still present on ${DRU_WORKER_SCRIPT_NAME}: ${remaining.join(', ')}.`);
  }

  return Object.freeze({
    scriptName: DRU_WORKER_SCRIPT_NAME,
    results: Object.freeze(results),
    remainingSecrets: Object.freeze(after),
  });
}

export async function run(env = process.env) {
  const outcome = await clearDruOverrideSecrets({
    accountId: env.CLOUDFLARE_ACCOUNT_ID,
    apiToken: env.CLOUDFLARE_API_TOKEN,
  });
  for (const result of outcome.results) {
    console.log(`${result.scriptName} ${result.secretName}: ${result.status}`);
  }
  console.log(`remaining secrets: ${outcome.remainingSecrets.join(', ') || '(none listed)'}`);
}

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirectRun) {
  try {
    await run();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
