import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const repository = 'Fremont-Derby/fremontderby';
const checkName = 'Workers Builds: fremontderby-jfl';
const publisherApp = 'cloudflare-workers-and-pages';
const uuid = /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;

function context(env) {
  if (env.GITHUB_ACTIONS !== 'true' || env.GITHUB_EVENT_NAME !== 'push'
    || env.GITHUB_REF !== 'refs/heads/fremontderby-jfl'
    || env.GITHUB_REF_NAME !== 'fremontderby-jfl'
    || env.GITHUB_REPOSITORY?.toLowerCase() !== repository.toLowerCase()
    || env.GITHUB_ACTOR !== 'subiki') {
    throw new Error('Publisher ordering is restricted to the trusted permanent JFL push.');
  }
  if ((env.GITHUB_API_URL && env.GITHUB_API_URL !== 'https://api.github.com')
    || (env.GITHUB_SERVER_URL && env.GITHUB_SERVER_URL !== 'https://github.com')) {
    throw new Error('Unexpected GitHub API identity; refusing credential forwarding.');
  }
  const sha = String(env.GITHUB_SHA || '').trim().toLowerCase();
  if (!/^[a-f0-9]{40}$/.test(sha)) throw new Error('A full permanent JFL commit SHA is required.');
  const token = String(env.GITHUB_TOKEN || '').trim();
  if (!token) throw new Error('Repository checks-read credential is required.');
  return { sha, token };
}

function publisherState(body, sha) {
  if (!Array.isArray(body?.check_runs) || !Number.isSafeInteger(body.total_count)
    || body.total_count !== body.check_runs.length || body.total_count > 100) {
    throw new Error('Publisher check response is incomplete or ambiguous.');
  }
  if (!body.check_runs.length) return null;
  if (body.check_runs.length !== 1) throw new Error('Expected one latest JFL publisher check.');
  const check = body.check_runs[0];
  let details;
  try { details = new URL(check.details_url); } catch { throw new Error('Invalid publisher identity.'); }
  const path = /^\/[a-f0-9]{32}\/workers\/services\/view\/fremontderby-jfl\/production\/builds\/([a-f0-9-]{36})$/i.exec(details.pathname);
  if (check.name !== checkName || check.app?.slug !== publisherApp
    || check.head_sha !== sha || !Number.isSafeInteger(check.id) || check.id <= 0
    || !uuid.test(check.external_id || '') || details.protocol !== 'https:'
    || details.hostname !== 'dash.cloudflare.com' || details.port
    || details.username || details.password || details.search || details.hash
    || !path || path[1] !== check.external_id) {
    throw new Error('Publisher check does not bind the expected JFL Worker, build and commit.');
  }
  if (['queued', 'in_progress'].includes(check.status)) return null;
  if (check.status !== 'completed' || check.conclusion !== 'success') {
    throw new Error('Current JFL Workers Build did not complete successfully; deploy held.');
  }
  return { sha, buildId: check.external_id, checkId: check.id };
}

export async function waitForJflWorkersBuild({
  env = process.env, fetchImpl = globalThis.fetch,
  sleep = milliseconds => new Promise(done => setTimeout(done, milliseconds)),
  now = Date.now, timeoutMs = 12 * 60_000, pollMs = 30_000,
} = {}) {
  const { sha, token } = context(env);
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || timeoutMs > 12 * 60_000
    || !Number.isFinite(pollMs) || pollMs <= 0 || pollMs > timeoutMs) {
    throw new Error('Publisher wait must stay within the bounded deployment window.');
  }
  const deadline = now() + timeoutMs;
  const url = `https://api.github.com/repos/${repository}/commits/${sha}/check-runs?check_name=${encodeURIComponent(checkName)}&filter=latest&per_page=100`;
  const maxAttempts = Math.ceil(timeoutMs / pollMs) + 1;
  for (let attempt = 0; attempt < maxAttempts && now() < deadline; attempt += 1) {
    let response;
    try {
      response = await fetchImpl(url, {
        headers: { accept: 'application/vnd.github+json', authorization: `Bearer ${token}`,
          'user-agent': 'fremont-jfl-publisher-ordering' },
        signal: AbortSignal.timeout(Math.ceil(Math.min(15_000, deadline - now()))),
      });
    } catch { throw new Error('Could not read the JFL publisher check; deploy held.'); }
    let wait = pollMs;
    if (response.status === 429 || (response.status === 403 && response.headers.get('retry-after'))) {
      const raw = response.headers.get('retry-after');
      const seconds = raw?.trim() && Number.isFinite(Number(raw))
        ? Number(raw) : (Date.parse(raw) - now()) / 1000;
      if (!Number.isFinite(seconds) || seconds <= 0 || seconds * 1000 > deadline - now()) {
        throw new Error('Publisher API throttle requires a valid Retry-After within the remaining window.');
      }
      wait = Math.max(pollMs, Math.ceil(seconds * 1000));
    } else {
      if (response.status !== 200) throw new Error(`Publisher API HTTP${response.status}; deploy held.`);
      let body;
      try { body = await response.json(); } catch { throw new Error('Invalid publisher check JSON; deploy held.'); }
      const result = publisherState(body, sha);
      if (result) return result;
    }
    const remaining = deadline - now();
    if (remaining <= 0 || wait > remaining) break;
    await sleep(wait);
  }
  throw new Error('Timed out waiting for the current successful JFL Workers Build; deploy held.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await waitForJflWorkersBuild();
    console.log(`JFL publisher settled: build ${result.buildId}, commit ${result.sha}.`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
