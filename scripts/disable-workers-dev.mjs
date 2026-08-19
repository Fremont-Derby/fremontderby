import { fileURLToPath } from 'node:url';
import { LANE_CUSTOM_DOMAINS } from './lane-custom-domains.mjs';

/**
 * Worker scripts that must have workers.dev / preview URLs disabled.
 * Derived from LANE_CUSTOM_DOMAINS services, plus legacy apex name and staging.
 */
function buildWorkerScriptNames() {
  const names = new Set();
  for (const row of LANE_CUSTOM_DOMAINS) {
    names.add(row.service);
  }
  // Legacy production script still seen in the wild for apex bindings.
  names.add('fremontderby-prod');
  // Staging Worker is not a public custom domain but must stay workers.dev-off.
  names.add('fremontderby-staging');
  return Object.freeze([...names]);
}

export const workerScriptNames = buildWorkerScriptNames();

function requireValue(value, name) {
  const normalized = String(value || '').trim();
  if (!normalized) throw new Error(`${name} is required.`);
  return normalized;
}

async function responsePayload(response, scriptName) {
  try {
    return await response.json();
  } catch {
    throw new Error(`Cloudflare returned a non-JSON response for ${scriptName}.`);
  }
}

function apiError(payload, response) {
  const messages = payload?.errors
    ?.map((error) => error?.message)
    .filter(Boolean)
    .join('; ');
  return messages || `HTTP ${response.status}`;
}

export async function disableWorkerSubdomain({
  accountId,
  apiToken,
  scriptName,
  fetchImpl = fetch,
}) {
  const account = requireValue(accountId, 'CLOUDFLARE_ACCOUNT_ID');
  const token = requireValue(apiToken, 'CLOUDFLARE_API_TOKEN');
  const worker = requireValue(scriptName, 'Worker script name');
  const url = [
    'https://api.cloudflare.com/client/v4/accounts',
    encodeURIComponent(account),
    'workers/scripts',
    encodeURIComponent(worker),
    'subdomain',
  ].join('/');

  const response = await fetchImpl(url, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  const payload = await responsePayload(response, worker);

  if (response.status === 404) {
    return Object.freeze({ scriptName: worker, status: 'absent' });
  }
  if (!response.ok || payload?.success !== true) {
    throw new Error(`Could not disable workers.dev for ${worker}: ${apiError(payload, response)}.`);
  }
  if (payload.result?.enabled !== false || payload.result?.previews_enabled !== false) {
    throw new Error(`Cloudflare did not confirm both workers.dev modes disabled for ${worker}.`);
  }

  return Object.freeze({ scriptName: worker, status: 'disabled' });
}

export async function disableAllWorkerSubdomains({
  accountId,
  apiToken,
  scriptNames = workerScriptNames,
  fetchImpl = fetch,
} = {}) {
  requireValue(accountId, 'CLOUDFLARE_ACCOUNT_ID');
  requireValue(apiToken, 'CLOUDFLARE_API_TOKEN');

  const results = [];
  for (const scriptName of scriptNames) {
    results.push(await disableWorkerSubdomain({
      accountId,
      apiToken,
      scriptName,
      fetchImpl,
    }));
  }
  return Object.freeze(results);
}

export async function run(env = process.env) {
  const results = await disableAllWorkerSubdomains({
    accountId: env.CLOUDFLARE_ACCOUNT_ID,
    apiToken: env.CLOUDFLARE_API_TOKEN,
  });
  for (const result of results) {
    console.log(`${result.scriptName}: ${result.status}`);
  }
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
