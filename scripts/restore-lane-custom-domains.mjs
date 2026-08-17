/**
 * Attach Fremont Derby hostnames to the correct Workers via Cloudflare API.
 * Requires CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_API_TOKEN.
 *
 * CRITICAL: production apex must stay on fremontderby or fremontderby-prod — never on a lane Worker.
 *
 * #639: Prefer durable `wrangler deploy --env <lane>` (custom_domain routes in wrangler.jsonc)
 * over relying on this script as the steady-state source of truth. This remains an emergency tool.
 */
import { fileURLToPath } from 'node:url';
import { LANE_CUSTOM_DOMAINS } from './lane-custom-domains.mjs';

/** @deprecated Prefer LANE_CUSTOM_DOMAINS; kept for existing tests. */
export const WORKER_DOMAIN_BINDINGS = LANE_CUSTOM_DOMAINS;

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


function allowedServicesFor(lane) {
  if (lane.hostname === 'fremontderby.com' || lane.hostname === 'www.fremontderby.com') {
    return ['fremontderby', 'fremontderby-prod'];
  }
  return [lane.service];
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

  for (const lane of WORKER_DOMAIN_BINDINGS) {
    const current = byHost.get(lane.hostname);
    const allowed = allowedServicesFor(lane);
    if (current && allowed.includes(current.service)) {
      console.log(`OK already correct: ${lane.hostname} -> ${current.service}`);
      results.push({ ...lane, status: 'already', service: current.service });
      continue;
    }
    if (current && !allowed.includes(current.service)) {
      console.warn(`MISROUTE: ${lane.hostname} currently -> ${current.service}; rebinding to ${lane.service}`);
    }
    console.log(`Attaching ${lane.hostname} -> ${lane.service}…`);
    const { response, payload } = await attachDomain(lane);
    if (!response.ok || payload.success === false) {
      const message = JSON.stringify(payload.errors || payload || { status: response.status });
      console.error(`FAIL ${lane.hostname}: ${message}`);
      results.push({ ...lane, status: 'error', message });
      continue;
    }
    console.log(`OK attached: ${lane.hostname} -> ${lane.service}`);
    results.push({ ...lane, status: current ? 'rebound' : 'attached' });
  }

  const after = await listWorkerDomains().catch(() => []);
  const apex = after.find((row) => row.hostname === 'fremontderby.com');
  if (apex && apex.service !== 'fremontderby-prod') {
    console.error(`CRITICAL: fremontderby.com still bound to ${apex.service}`);
    process.exitCode = 1;
  }

  console.log(JSON.stringify({ results, domains: after.map((r) => ({ hostname: r.hostname, service: r.service })) }, null, 2));
  if (results.some((row) => row.status === 'error')) process.exitCode = 1;
}

const isDirect = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirect) {
  main().catch((error) => {
    const message = String(error?.message || error);
    console.error(message);
    if (/CLOUDFLARE_ACCOUNT_ID is required|CLOUDFLARE_API_TOKEN is required/i.test(message)) {
      console.error('HUMAN REQUIRED: set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN Actions secrets for domain restore.');
    }
    process.exitCode = 1;
  });
}
