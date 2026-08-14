/**
 * Assert public lane hosts report the expected ENVIRONMENT identity.
 * Usage: node scripts/assert-lane-health.mjs
 * Exit 1 on any mismatch or transport failure.
 */
const checks = [
  { host: 'dru.fremontderby.com', expect: 'dru' },
  { host: 'jfl.fremontderby.com', expect: 'jfl' },
  { host: 'gamma.fremontderby.com', expect: 'gamma' },
  { host: 'fremontderby.com', expect: 'production' },
];

async function probe({ host, expect }) {
  const url = `https://${host}/health/environment`;
  const response = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'fremontderby-lane-health' },
  });
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error(`${host}: non-JSON health body: ${text.slice(0, 120)}`);
  }
  const environment = body?.environment;
  const ok = body?.ok === true;
  console.log(JSON.stringify({ host, status: response.status, environment, ok, expect }));
  if (!response.ok) throw new Error(`${host}: HTTP ${response.status}`);
  if (environment !== expect) {
    throw new Error(`${host}: environment="${environment}" expected="${expect}"`);
  }
}

let failed = 0;
for (const check of checks) {
  try {
    await probe(check);
  } catch (error) {
    console.error(String(error.message || error));
    failed += 1;
  }
}
if (failed) {
  console.error(`Lane health failed (${failed}/${checks.length}). Domain attach is not enough; deploy --env with vars from wrangler.jsonc.`);
  process.exit(1);
}
console.log('All lane health identities OK.');
