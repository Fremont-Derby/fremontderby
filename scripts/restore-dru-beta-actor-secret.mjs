import { spawnSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const projectUrl = String(process.env.LANE_SUPABASE_URL || '').replace(/\/$/, '');
const serviceRoleKey = String(process.env.LANE_SUPABASE_SERVICE_ROLE_KEY || '');
const cloudflareToken = String(process.env.CLOUDFLARE_API_TOKEN || '');
const cloudflareAccountId = String(process.env.CLOUDFLARE_ACCOUNT_ID || '');
const githubToken = String(process.env.GITHUB_TOKEN || '');
const repo = process.env.GITHUB_REPOSITORY || 'Fremont-Derby/fremontderby';
const druSourceDir = resolve(String(process.env.DRU_SOURCE_DIR || ''));
const actorEmail = 'dru-actor@fremontderby.com';
const wranglerVersion = '4.125.0';

function requireValue(name, value) {
  if (!String(value || '').trim()) throw new Error(`${name} is required.`);
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

function run(command, args, { cwd = process.cwd(), input, actorId = '' } = {}) {
  const result = spawnSync(command, args, {
    cwd,
    env: process.env,
    input,
    encoding: 'utf8',
    maxBuffer: 4 * 1024 * 1024,
  });
  if (result.stdout) process.stdout.write(sanitize(result.stdout, actorId));
  if (result.stderr) process.stderr.write(sanitize(result.stderr, actorId));
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${args.slice(0, 3).join(' ')} failed with exit ${result.status}.`);
  return String(result.stdout || '').trim();
}

function runWrangler(args, options = {}) {
  return run('npx', ['--yes', `wrangler@${wranglerVersion}`, ...args], options);
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
  requireValue('DRU_SOURCE_DIR', process.env.DRU_SOURCE_DIR || '');

  const actorId = await resolveActorId();
  console.log(`::add-mask::${actorId}`);
  console.log('Resolved exactly one DRU beta actor from Supabase Auth; value masked.');

  // Deploy the exact read-only DRU branch checkout, never main source, and attach
  // the missing secret atomically. Cloudflare preserves omitted existing secrets.
  const druSha = run('git', ['rev-parse', 'HEAD'], { cwd: druSourceDir, actorId });
  if (!/^[0-9a-f]{40}$/i.test(druSha)) throw new Error('Could not resolve the DRU checkout SHA.');
  console.log(`Read-only DRU source checkout: ${druSha}`);

  const tempDir = await mkdtemp(join(tmpdir(), 'fremontderby-dru-secret-'));
  const secretsPath = join(tempDir, 'secrets.json');
  try {
    await writeFile(secretsPath, JSON.stringify({ BETA_ACTOR_USER_ID: actorId }), { mode: 0o600 });
    runWrangler(
      [
        'deploy',
        '--env', 'dru',
        '--secrets-file', secretsPath,
        '--tag', druSha,
        '--message', `git:${druSha}`,
      ],
      { cwd: druSourceDir, actorId },
    );
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }

  const listed = runWrangler(['secret', 'list', '--env', 'dru'], { cwd: druSourceDir, actorId });
  if (!/\bBETA_ACTOR_USER_ID\b/.test(listed)) {
    throw new Error('DRU secret list does not contain BETA_ACTOR_USER_ID after atomic deploy.');
  }

  console.log('PASS: DRU deployed from its own branch with BETA_ACTOR_USER_ID present; value was never logged.');
  await postIssue([
    '## Break-glass DRU actor-secret atomic repair — PASS',
    '',
    '- Resolved exactly one `dru-actor@fremontderby.com` identity from the existing lane Supabase Auth project at runtime.',
    '- Masked the UUID; it was not committed or posted.',
    `- Deployed the read-only \`fremontderby-dru\` branch source at SHA \`${druSha}\` with an ephemeral \`--secrets-file\` containing only the missing actor secret.`,
    '- Existing omitted Worker secrets are preserved by Wrangler deployment semantics.',
    '- `wrangler secret list --env dru` confirms `BETA_ACTOR_USER_ID` is now present.',
    '- No DRU Git branch mutation was performed.',
    '',
    'The same job will now rerun the Cloudflare-native DRU build and complete the hosted isolation/runtime proof.',
  ].join('\n'));
}

main().catch(async (error) => {
  const message = sanitize(error instanceof Error ? error.message : String(error));
  console.error(message);
  await postIssue(`## Break-glass DRU actor-secret atomic repair — FAIL\n\n\`${message}\`\n\nNo actor UUID or credential value was intentionally logged. Keep #1192 open.`);
  process.exitCode = 1;
});
