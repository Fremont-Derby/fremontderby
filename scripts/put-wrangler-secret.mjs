#!/usr/bin/env node
/**
 * Put a Worker secret via classic secret put only.
 * Do not use `versions secret put` — it can create a live Worker version
 * that steals traffic from a subsequent wrangler deploy (versionTag loss).
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
const code = await run(['--yes', 'wrangler@4', 'secret', 'put', name, ...envArgs]);
if (code !== 0) {
  console.warn('classic secret put failed; not falling back to versions secret put');
  process.exit(0);
}
process.exit(0);
