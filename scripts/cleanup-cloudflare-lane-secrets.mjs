import { fileURLToPath } from 'node:url';

export const obsoleteSecretBindingsByLane = Object.freeze({
  jfl: Object.freeze([
    'SUPABASE_URL',
    'SUPABASE_PUBLISHABLE_KEY',
    'EXPECTED_SUPABASE_PROJECT_REF',
  ]),
});

const workerNameByLane = Object.freeze({
  jfl: 'fremontderby-jfl',
});

function requireValue(value, name) {
  const normalized = String(value || '').trim();
  if (!normalized) throw new Error(`${name} is required for JFL Cloudflare cleanup.`);
  return normalized;
}

export function selectObsoleteSecrets(lane, currentNames = []) {
  const obsolete = obsoleteSecretBindingsByLane[lane];
  if (!obsolete) return [];
  const present = new Set(currentNames.map((name) => String(name || '').trim()).filter(Boolean));
  return obsolete.filter((name) => present.has(name));
}

function cloudflareErrorMessage(payload) {
  const messages = Array.isArray(payload?.errors)
    ? payload.errors.map((error) => error?.message).filter(Boolean)
    : [];
  return messages.join('; ') || 'unknown Cloudflare API error';
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function cleanupCloudflareLaneSecrets(
  lane,
  {
    env = process.env,
    fetchImpl = fetch,
    log = console.log,
  } = {},
) {
  const workerName = workerNameByLane[lane];
  if (!workerName) return { lane, workerName: null, deleted: [] };

  const accountId = requireValue(env.CLOUDFLARE_ACCOUNT_ID, 'CLOUDFLARE_ACCOUNT_ID');
  const apiToken = requireValue(env.CLOUDFLARE_API_TOKEN, 'CLOUDFLARE_API_TOKEN');
  const baseUrl = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/workers/scripts/${encodeURIComponent(workerName)}/secrets`;
  const headers = { Authorization: `Bearer ${apiToken}` };

  const listResponse = await fetchImpl(baseUrl, { headers });
  const listPayload = await readJson(listResponse);
  if (!listResponse.ok || listPayload?.success !== true || !Array.isArray(listPayload.result)) {
    throw new Error(
      `Could not list Cloudflare secrets for ${workerName}: ${cloudflareErrorMessage(listPayload)}`,
    );
  }

  const currentNames = listPayload.result.map((binding) => binding?.name).filter(Boolean);
  const toDelete = selectObsoleteSecrets(lane, currentNames);

  for (const secretName of toDelete) {
    const deleteUrl = `${baseUrl}/${encodeURIComponent(secretName)}?url_encoded=true`;
    const deleteResponse = await fetchImpl(deleteUrl, {
      method: 'DELETE',
      headers,
    });
    const deletePayload = await readJson(deleteResponse);
    if (!deleteResponse.ok || deletePayload?.success !== true) {
      throw new Error(
        `Could not delete obsolete JFL Cloudflare secret ${secretName}: ${cloudflareErrorMessage(deletePayload)}`,
      );
    }
    log(`Deleted obsolete JFL Cloudflare secret binding: ${secretName}`);
  }

  if (toDelete.length === 0) {
    log('JFL Cloudflare secret cleanup: no obsolete binding names present.');
  }

  return { lane, workerName, deleted: toDelete };
}

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirectRun) {
  cleanupCloudflareLaneSecrets(process.argv[2])
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
