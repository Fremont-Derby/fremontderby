import { fileURLToPath } from 'node:url';
import { LANE_CUSTOM_DOMAINS } from './lane-custom-domains.mjs';

function requireEnv(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

async function cf(path) {
  const accountId = requireEnv('CLOUDFLARE_ACCOUNT_ID');
  const token = requireEnv('CLOUDFLARE_API_TOKEN');
  const url = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}${path}`;
  const response = await fetch(url, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
  });
  const payload = await response.json().catch(() => ({}));
  return { response, payload };
}

function allowedServicesForDomain(row) {
  // Production apex may be attached to either the top-level Worker name
  // (`fremontderby`) or the historical `fremontderby-prod` script — both are live-safe.
  if (row.env === 'production') {
    return Object.freeze(['fremontderby', 'fremontderby-prod']);
  }
  return Object.freeze([row.service]);
}

// Derived from LANE_CUSTOM_DOMAINS so diagnose hosts cannot drift from domain inventory.
export const EXPECTED_WORKER_DOMAIN_BINDINGS = new Map(
  LANE_CUSTOM_DOMAINS.map((row) => [row.hostname, allowedServicesForDomain(row)]),
);

export async function diagnoseWorkerDomains() {
  const expected = EXPECTED_WORKER_DOMAIN_BINDINGS;
  const { response, payload } = await cf('/workers/domains');
  const domains = (payload.result || []).map((row) => ({
    hostname: row.hostname,
    service: row.service,
    environment: row.environment,
    id: row.id,
  }));

  console.log(JSON.stringify({ status: response.status, success: payload.success, domains, errors: payload.errors }, null, 2));

  const scripts = new Set();
  for (const services of expected.values()) {
    for (const service of services) scripts.add(service);
  }
  for (const script of scripts) {
    const r = await cf(`/workers/scripts/${encodeURIComponent(script)}`);
    console.log(JSON.stringify({
      script,
      status: r.response.status,
      ok: r.response.ok,
      modified: r.payload?.result?.modified_on,
    }));
  }

  let failed = 0;
  for (const [hostname, services] of expected) {
    const allowed = Array.isArray(services) ? services : [services];
    const row = domains.find((d) => d.hostname === hostname);
    if (!row) {
      console.error(`MISSING binding: ${hostname} (expected one of ${allowed.join('|')})`);
      failed += 1;
      continue;
    }
    if (!allowed.includes(row.service)) {
      console.error(`MISROUTE: ${hostname} -> ${row.service} (expected one of ${allowed.join('|')})`);
      failed += 1;
    } else {
      console.log(`OK ${hostname} -> ${row.service}`);
    }
  }
  return { failed, domains };
}

const isDirect = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirect) {
  const { failed } = await diagnoseWorkerDomains();
  if (failed) process.exit(1);
}
