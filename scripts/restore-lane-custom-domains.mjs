/**
 * Attach Fremont Derby lane hostnames to matching Workers via Cloudflare API.
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

async function cf(path, { method = 'GET', body, base = 'accounts' } = {}) {
  const accountId = requireEnv('CLOUDFLARE_ACCOUNT_ID');
  const token = requireEnv('CLOUDFLARE_API_TOKEN');
  const root =
    base === 'accounts'
      ? `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}`
      : 'https://api.cloudflare.com/client/v4';
  const url = `${root}${path}`;
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

async function findZoneId(hostname) {
  const parts = hostname.split('.');
  // fremontderby.com
  const zoneName = parts.slice(-2).join('.');
  const { response, payload } = await cf(
    `/zones?name=${encodeURIComponent(zoneName)}`,
    { base: 'root' },
  );
  // fix: zones are under /zones not accounts
  return { response, payload, zoneName };
}

async function cfZones(path, opts = {}) {
  const token = requireEnv('CLOUDFLARE_API_TOKEN');
  const url = `https://api.cloudflare.com/client/v4${path}`;
  const response = await fetch(url, {
    method: opts.method || 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  return { response, payload };
}

async function ensureZoneVisibility(hostname) {
  const zoneName = hostname.split('.').slice(-2).join('.');
  const { response, payload } = await cfZones(`/zones?name=${encodeURIComponent(zoneName)}`);
  if (!response.ok || !payload.result?.length) {
    console.warn(`Zone lookup failed for ${zoneName}: ${JSON.stringify(payload.errors || payload)}`);
    return null;
  }
  return payload.result[0].id;
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
    const zoneId = await ensureZoneVisibility(lane.hostname);
    if (zoneId) console.log(`zone ${lane.hostname} -> ${zoneId}`);

    const current = byHost.get(lane.hostname);
    if (current && current.service === lane.service) {
      console.log(`OK already attached: ${lane.hostname} -> ${lane.service}`);
      results.push({ ...lane, status: 'already', zoneId });
      continue;
    }
    console.log(`Attaching ${lane.hostname} -> ${lane.service}…`);
    const { response, payload } = await attachDomain(lane);
    if (!response.ok || payload.success === false) {
      const message = JSON.stringify(payload.errors || payload || { status: response.status });
      console.error(`FAIL ${lane.hostname}: ${message}`);
      results.push({ ...lane, status: 'error', message, zoneId });
      continue;
    }
    console.log(`OK attached: ${lane.hostname}`);
    results.push({ ...lane, status: 'attached', zoneId });
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
