/**
 * Break-glass repair for Fremont Derby Worker custom-domain bindings.
 * Requires CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_API_TOKEN.
 *
 * Steady-state domain ownership belongs to Wrangler lane deploys. This script
 * must only mutate after Cloudflare has positively reported current domain state.
 *
 * CRITICAL: production apex must stay on fremontderby-prod — never on a lane Worker.
 */
import { fileURLToPath } from 'node:url';

export const WORKER_DOMAIN_BINDINGS = Object.freeze([
  { hostname: 'fremontderby.com', service: 'fremontderby-prod' },
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

export async function listWorkerDomains() {
  const { response, payload } = await cf('/workers/domains');
  if (!response.ok || payload.success === false) {
    throw new Error(`list domains failed: ${JSON.stringify(payload.errors || payload)}`);
  }
  return payload.result || [];
}

export async function attachDomain({ hostname, service, environment = 'production' }) {
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

export async function restoreWorkerDomains({
  listDomains = listWorkerDomains,
  attach = attachDomain,
  logger = console,
} = {}) {
  logger.log('Listing existing worker domains…');

  // Safety invariant: inability to enumerate is not evidence that a domain is
  // missing. Let this throw so no mutation occurs while current state is unknown.
  const existing = await listDomains();
  for (const row of existing) {
    logger.log(`  ${row.hostname} -> ${row.service}`);
  }

  const byHost = new Map(existing.map((row) => [row.hostname, row]));
  const results = [];

  for (const lane of WORKER_DOMAIN_BINDINGS) {
    const current = byHost.get(lane.hostname);
    if (current?.service === lane.service) {
      logger.log(`OK already correct: ${lane.hostname} -> ${lane.service}`);
      results.push({ ...lane, status: 'already' });
      continue;
    }

    if (current) {
      logger.warn(`MISROUTE: ${lane.hostname} currently -> ${current.service}; rebinding to ${lane.service}`);
    } else {
      logger.warn(`MISSING: ${lane.hostname} is absent from Cloudflare Worker custom domains`);
    }

    logger.log(`Attaching ${lane.hostname} -> ${lane.service}…`);
    const { response, payload } = await attach(lane);
    if (!response?.ok || payload?.success === false) {
      const message = JSON.stringify(payload?.errors || payload || { status: response?.status });
      throw new Error(`attach failed for ${lane.hostname}: ${message}`);
    }
    results.push({ ...lane, status: current ? 'rebound' : 'attached' });
  }

  // Verification is also fail-closed. If Cloudflare cannot report the final
  // state, the repair must fail rather than silently claiming success.
  const after = await listDomains();
  const afterByHost = new Map(after.map((row) => [row.hostname, row]));
  const mismatches = WORKER_DOMAIN_BINDINGS.filter(
    (lane) => afterByHost.get(lane.hostname)?.service !== lane.service,
  );
  if (mismatches.length > 0) {
    throw new Error(
      `post-repair verification failed: ${mismatches.map((lane) => `${lane.hostname}->${lane.service}`).join(', ')}`,
    );
  }

  return {
    results,
    domains: after.map((row) => ({ hostname: row.hostname, service: row.service })),
  };
}

async function main() {
  const output = await restoreWorkerDomains();
  console.log(JSON.stringify(output, null, 2));
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
