#!/usr/bin/env node
/**
 * Put a Worker secret without failing the lane deploy when Cloudflare
 * requires versioned secret APIs (latest version not yet "deployed").
 */
import { spawn } from 'node:child_process';

const [name, envName] = process.argv.slice(2);
const value = process.env.SECRET_VALUE || '';
if (!name || !value) {
  console.error('Usage: SECRET_VALUE=... node scripts/put-wrangler-secret.mjs NAME [wranglerEnv]');
  process.exit(1);
}

function run(args) {
  return new Promise((resolve) => {
    const child = spawn('npx', args, { stdio: ['pipe', 'inherit', 'inherit'], shell: true });
    child.stdin.write(value);
    child.stdin.end();
    child.on('exit', (code) => resolve(code || 0));
  });
}

const envArgs = envName ? ['--env', envName] : [];
// Prefer classic secret put so we do not create a non-stamped Worker version that can become live.
let code = await run(['--yes', 'wrangler@4', 'secret', 'put', name, ...envArgs]);
if (code !== 0) {
  console.warn('classic secret put failed; trying versions secret put…');
  code = await run(['--yes', 'wrangler@4', 'versions', 'secret', 'put', name, ...envArgs]);
}
if (code !== 0) {
  console.warn('Secret put did not complete; deploy already published code. Continuing.');
  process.exit(0);
}
process.exit(0);
