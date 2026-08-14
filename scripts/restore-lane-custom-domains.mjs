/**
 * Attach Fremont Derby lane hostnames to the matching Workers via Cloudflare API.
 * Requires CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_API_TOKEN.
 */
import { fileURLToPath } from 'node:url';

const LANES = Object.freeze([
  { hostname: 'dru.fremontderby.com', service: 'fremontderby-dru' },
  { hostname: 'jfl.fremontderby.com', service: 'fremontderby-jfl' },
  { hostname: 'gamma.fremontderby.com', service: 'fremontderby-gamma' },
]);

function requireEnv(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

async function cf(path, { method = 'GET', body } = {}) {
  const accountId = requireEnv('CLOUDFLARE_ACCOUNT_ID');
  const token = requireEnv('CLOUDFLARE_API_TOKEN');
  const url = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}${path}`;
  const response = await fetch(url, {
    method,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  return { response, payload };
}

async function listWorkerDomains() {
  const { response, payload } = await cf('/workers/domains');
  if (!response.ok || payload.success === false) {
    throw new Error(`list domains failed: ${JSON.stringify(payload.errors || payload)}`);
  }
  return payload.result || [];
}

async function attachDomain({ hostname, service, environment = 'production' }) {
  // Cloudflare Workers custom domains API (account-level)
  let result = await cf('/workers/domains', {
    method: 'PUT',
    body: { hostname, service, environment },
  });
  if (result.response.status === 405 || result.response.status === 404) {
    result = await cf('/workers/domains', {
      method: 'POST',
      body: { hostname, service, environment },
    });
  }
  return result;
}

async function main() {
  console.log('Listing existing worker domains…');
  let existing = [];
  try {
    existing = await listWorkerDomains();
    for (const row of existing) {
      console.log(`  ${row.hostname} -> ${row.service}`);
    }
  } catch (error) {
    console.warn(String(error.message || error));
  }

  const byHost = new Map(existing.map((row) => [row.hostname, row]));
  const results = [];

  for (const lane of LANES) {
    const current = byHost.get(lane.hostname);
    if (current && current.service === lane.service) {
      console.log(`OK already attached: ${lane.hostname} -> ${lane.service}`);
      results.push({ ...lane, status: 'already' });
      continue;
    }
    console.log(`Attaching ${lane.hostname} -> ${lane.service}…`);
    const { response, payload } = await attachDomain(lane);
    if (!response.ok || payload.success === false) {
      const message = JSON.stringify(payload.errors || payload || { status: response.status });
      console.error(`FAIL ${lane.hostname}: ${message}`);
      results.push({ ...lane, status: 'error', message });
      continue;
    }
    console.log(`OK attached: ${lane.hostname}`);
    results.push({ ...lane, status: 'attached' });
  }

  console.log(JSON.stringify({ results }, null, 2));
  if (results.some((row) => row.status === 'error')) process.exitCode = 1;
}

const isDirect = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirect) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
