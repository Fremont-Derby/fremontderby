import { fileURLToPath } from 'node:url';

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

const { response, payload } = await cf('/workers/domains');
console.log(JSON.stringify({
  status: response.status,
  success: payload.success,
  domains: (payload.result || []).map((row) => ({
    hostname: row.hostname,
    service: row.service,
    environment: row.environment,
    id: row.id,
  })),
  errors: payload.errors,
}, null, 2));

for (const script of ['fremontderby', 'fremontderby-dru', 'fremontderby-jfl', 'fremontderby-gamma', 'fremontderby-prod']) {
  const r = await cf(`/workers/scripts/${encodeURIComponent(script)}`);
  const ok = r.response.ok
  console.log(JSON.stringify({
    script,
    status: r.response.status,
    ok,
    id: r.payload?.result?.id,
    modified: r.payload?.result?.modified_on,
    errors: r.payload?.errors,
  }))
}
