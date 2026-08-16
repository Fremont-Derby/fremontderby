#!/usr/bin/env node
/**
 * Fail closed if production hostnames do not resolve or /health is down.
 * Uses DNS-over-HTTPS (no local dig required) — post-incident guard after
 * missing Workers custom-domain binding left apex with no A/AAAA.
 */
import { fileURLToPath } from 'node:url';

export const PRODUCTION_DNS_HOSTS = Object.freeze([
  'fremontderby.com',
  'www.fremontderby.com',
]);

const DOH = 'https://cloudflare-dns.com/dns-query';

export async function resolveViaDoh(hostname, type = 'A', fetchImpl = fetch) {
  const url = `${DOH}?name=${encodeURIComponent(hostname)}&type=${type}`;
  const response = await fetchImpl(url, {
    headers: { Accept: 'application/dns-json', 'User-Agent': 'fremontderby-assert-production-dns' },
  });
  if (!response.ok) {
    throw new Error(`DoH HTTP ${response.status} for ${hostname} ${type}`);
  }
  const body = await response.json();
  const answers = Array.isArray(body.Answer) ? body.Answer : [];
  const records = answers
    .filter((row) => Number(row.type) === (type === 'AAAA' ? 28 : 1) || row.type === type)
    .map((row) => row.data)
    .filter(Boolean);
  return {
    hostname,
    type,
    status: body.Status,
    records,
    ok: records.length > 0,
  };
}

export async function assertHostnameResolves(hostname, fetchImpl = fetch) {
  const a = await resolveViaDoh(hostname, 'A', fetchImpl);
  const aaaa = await resolveViaDoh(hostname, 'AAAA', fetchImpl).catch(() => ({
    hostname,
    type: 'AAAA',
    records: [],
    ok: false,
  }));
  const ok = a.ok || aaaa.ok;
  return {
    hostname,
    ok,
    a: a.records,
    aaaa: aaaa.records,
    error: ok ? null : `${hostname}: no A/AAAA via DoH (Status A=${a.status})`,
  };
}

export async function assertHostnameHealth(hostname, fetchImpl = fetch) {
  const url = `https://${hostname}/health`;
  const response = await fetchImpl(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'fremontderby-assert-production-dns' },
    redirect: 'follow',
  });
  const text = await response.text();
  let body = null;
  try {
    body = JSON.parse(text);
  } catch {
    /* ignore */
  }
  const ok = response.status >= 200 && response.status < 300 && body?.ok === true;
  return {
    hostname,
    url,
    status: response.status,
    ok,
    error: ok ? null : `${url}: HTTP ${response.status} body=${text.slice(0, 120)}`,
  };
}

export async function assertProductionDnsAndHealth({
  hosts = PRODUCTION_DNS_HOSTS,
  fetchImpl = fetch,
} = {}) {
  const dnsResults = [];
  const healthResults = [];
  for (const host of hosts) {
    try {
      dnsResults.push(await assertHostnameResolves(host, fetchImpl));
    } catch (error) {
      dnsResults.push({
        hostname: host,
        ok: false,
        a: [],
        aaaa: [],
        error: String(error.message || error),
      });
    }
  }
  const dnsFailed = dnsResults.filter((row) => !row.ok);
  // Only hit HTTP when DNS looks present for that host
  for (const row of dnsResults.filter((r) => r.ok)) {
    try {
      healthResults.push(await assertHostnameHealth(row.hostname, fetchImpl));
    } catch (error) {
      healthResults.push({
        hostname: row.hostname,
        ok: false,
        error: String(error.message || error),
      });
    }
  }
  const healthFailed = healthResults.filter((row) => !row.ok);
  return {
    ok: dnsFailed.length === 0 && healthFailed.length === 0,
    dnsResults,
    healthResults,
    dnsFailed,
    healthFailed,
  };
}

const isDirect = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirect) {
  const summary = await assertProductionDnsAndHealth();
  console.log(JSON.stringify(summary, null, 2));
  if (!summary.ok) {
    console.error(
      'Production DNS/health guard failed. Check Workers custom domain binding for fremontderby.com → fremontderby-prod (workflow: Restore lane custom domains). Negative DNS cache may still affect clients for ~30m after repair.',
    );
    process.exit(1);
  }
  console.log('Production DNS + /health OK for', PRODUCTION_DNS_HOSTS.join(', '));
}
