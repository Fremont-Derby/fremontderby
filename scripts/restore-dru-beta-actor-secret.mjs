import { spawnSync } from 'node:child_process';

const projectUrl = String(process.env.LANE_SUPABASE_URL || '').replace(/\/$/, '');
const serviceRoleKey = String(process.env.LANE_SUPABASE_SERVICE_ROLE_KEY || '');
const cloudflareToken = String(process.env.CLOUDFLARE_API_TOKEN || '');
const cloudflareAccountId = String(process.env.CLOUDFLARE_ACCOUNT_ID || '');
const githubToken = String(process.env.GITHUB_TOKEN || '');
const repo = process.env.GITHUB_REPOSITORY || 'Fremont-Derby/fremontderby';
const actorEmail = 'dru-actor@fremontderby.com';
const wranglerVersion = '4.125.0';

function requireValue(name, value) {
  if (!value.trim()) throw new Error(`${name} is required.`);
}

function sanitize(text, actorId = '') {
  let result = String(text || '');
  for (const secret of [serviceRoleKey, cloudflareToken, actorId]) {
    if (secret) result = result.split(secret).join('<redacted>');
  }
  return result;
}

async function postIssue(body) {
  if (!githubToken) return;
  const response = await fetch(`https://api.github.com/repos/${repo}/issues/1192/comments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${githubToken}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ body }),
  });
  if (!response.ok) console.error(`Could not post #1192 repair note (${response.status}).`);
}

function runWrangler(args, { input, actorId = '' } = {}) {
  const result = spawnSync('npx', ['--yes', `wrangler@${wranglerVersion}`, ...args], {
    env: process.env,
    input,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
  });
  if (result.stdout) process.stdout.write(sanitize(result.stdout, actorId));
  if (result.stderr) process.stderr.write(sanitize(result.stderr, actorId));
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Wrangler ${args.slice(0, 2).join(' ')} failed with exit ${result.status}.`);
  return result.stdout || '';
}

async function resolveActorId() {
  const response = await fetch(`${projectUrl}/auth/v1/admin/users?page=1&per_page=1000`, {
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
    },
  });
  if (!response.ok) throw new Error(`Supabase Auth admin user lookup failed (${response.status}).`);
  const payload = await response.json();
  const users = Array.isArray(payload) ? payload : Array.isArray(payload?.users) ? payload.users : [];
  const matches = users.filter((user) => String(user?.email || '').toLowerCase() === actorEmail);
  if (matches.length !== 1) throw new Error(`Expected exactly one DRU actor in Supabase Auth; found ${matches.length}.`);
  const id = String(matches[0]?.id || '');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    throw new Error('Resolved DRU actor ID is not a UUID.');
  }
  return id;
}

async function main() {
  requireValue('LANE_SUPABASE_URL', projectUrl);
  requireValue('LANE_SUPABASE_SERVICE_ROLE_KEY', serviceRoleKey);
  requireValue('CLOUDFLARE_API_TOKEN', cloudflareToken);
  requireValue('CLOUDFLARE_ACCOUNT_ID', cloudflareAccountId);

  const actorId = await resolveActorId();
  // Keep the runtime-only actor UUID out of all GitHub logs from this point forward.
  console.log(`::add-mask::${actorId}`);
  console.log('Resolved exactly one DRU beta actor from Supabase Auth; value masked.');

  process.env.SECRET_VALUE = actorId;
  runWrangler(['secret', 'put', 'BETA_ACTOR_USER_ID', '--env', 'dru'], {
    input: `${actorId}\n`,
    actorId,
  });
  delete process.env.SECRET_VALUE;

  const listed = runWrangler(['secret', 'list', '--env', 'dru'], { actorId });
  if (!/\bBETA_ACTOR_USER_ID\b/.test(listed)) {
    throw new Error('DRU secret list does not contain BETA_ACTOR_USER_ID after repair.');
  }

  console.log('PASS: DRU BETA_ACTOR_USER_ID secret name is present after repair; value was never logged.');
  await postIssue([
    '## Break-glass DRU actor-secret repair — PASS',
    '',
    '- Resolved exactly one `dru-actor@fremontderby.com` identity from the existing lane Supabase Auth project at runtime.',
    '- Masked the UUID before invoking Wrangler; the value was not committed or posted.',
    '- Restored Worker secret `BETA_ACTOR_USER_ID` to the DRU Wrangler environment.',
    '- `wrangler secret list --env dru` confirms the secret name is present.',
    '- No DRU Git branch mutation was performed.',
    '',
    'The same job will now rerun the full hosted lane-isolation/runtime proof.',
  ].join('\n'));
}

main().catch(async (error) => {
  const message = sanitize(error instanceof Error ? error.message : String(error));
  console.error(message);
  await postIssue(`## Break-glass DRU actor-secret repair — FAIL\n\n\`${message}\`\n\nNo actor UUID or credential value was intentionally logged. Keep #1192 open.`);
  process.exitCode = 1;
});
