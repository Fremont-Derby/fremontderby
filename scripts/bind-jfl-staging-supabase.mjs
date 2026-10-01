#!/usr/bin/env node
/**
 * Bind fremontderby-jfl Worker secrets to the staging Supabase project
 * (schema jfl lives there). Requires CLOUDFLARE_* and LANE_SUPABASE_SERVICE_ROLE_KEY.
 */
import { readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';

function requireEnv(name) {
  const v = String(process.env[name] || '').trim();
  if (!v) throw new Error(`missing ${name}`);
  return v;
}

requireEnv('CLOUDFLARE_API_TOKEN');
requireEnv('CLOUDFLARE_ACCOUNT_ID');
const serviceRole = requireEnv('LANE_SUPABASE_SERVICE_ROLE_KEY');

const wrangler = readFileSync('wrangler.jsonc', 'utf8');
const pubMatch = wrangler.match(/"SUPABASE_PUBLISHABLE_KEY"\s*:\s*"(sb_publishable_[^"]+)"/);
if (!pubMatch) throw new Error('could not parse SUPABASE_PUBLISHABLE_KEY from wrangler.jsonc');
const publishable = pubMatch[1];

const secrets = [
  ['SUPABASE_URL', 'https://oqkkvqkerusepyokzbmt.supabase.co'],
  ['EXPECTED_SUPABASE_PROJECT_REF', 'oqkkvqkerusepyokzbmt'],
  ['SUPABASE_PUBLISHABLE_KEY', publishable],
  ['SUPABASE_SERVICE_ROLE_KEY', serviceRole],
];

function run(args, { input } = {}) {
  return new Promise((resolve) => {
    const child = spawn('npx', args, { stdio: input != null ? ['pipe', 'inherit', 'inherit'] : 'inherit', shell: true });
    if (input != null) {
      child.stdin.write(input);
      child.stdin.end();
    }
    child.on('exit', (code) => resolve(code || 0));
  });
}

for (const [name, value] of secrets) {
  console.log('Putting', name, '…');
  // Classic secret put targets the deployed Worker configuration.
  let code = await run(['--yes', 'wrangler@4', 'secret', 'put', name, '--env', 'jfl'], { input: value });
  if (code !== 0) {
    console.warn('classic put failed; trying versions secret put…');
    code = await run(['--yes', 'wrangler@4', 'versions', 'secret', 'put', name, '--env', 'jfl'], { input: value });
  }
  if (code !== 0) {
    throw new Error(`failed to put secret ${name}`);
  }
}

// Promote the secret-bearing Worker version to live traffic.
console.log('Deploying secret versions to live traffic…');
let deployCode = await run([
  '--yes', 'wrangler@4', 'versions', 'deploy', '--env', 'jfl', '--yes',
]);
if (deployCode !== 0) {
  console.warn('versions deploy exited', deployCode, '— trying full deploy --env jfl');
  deployCode = await run(['--yes', 'wrangler@4', 'deploy', '--env', 'jfl']);
}
if (deployCode !== 0) {
  console.warn('wrangler deploy --env jfl exited', deployCode, '— verifying readiness anyway');
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
for (let i = 1; i <= 10; i++) {
  try {
    const response = await fetch('https://jfl.fremontderby.com/health/environment');
    const body = await response.json();
    console.log(JSON.stringify({ attempt: i, ok: body.ok, projectRef: body.supabase?.projectRef }));
    if (body.ok === true && body.supabase?.projectRef === 'oqkkvqkerusepyokzbmt') {
      console.log('JFL staging Supabase binding OK');
      process.exit(0);
    }
  } catch (error) {
    console.warn(String(error.message || error));
  }
  await sleep(5000);
}
console.error('JFL readiness still red after secret bind');
process.exit(1);
