#!/usr/bin/env node
import { spawn } from 'node:child_process';

const [name, envName] = process.argv.slice(2);
const value = process.env.SECRET_VALUE || '';
if (!name || !value) {
  console.error('Usage: SECRET_VALUE=... node scripts/put-wrangler-secret.mjs NAME [wranglerEnv]');
  process.exit(1);
}
const args = ['--yes', 'wrangler@4', 'secret', 'put', name];
if (envName) args.push('--env', envName);
const child = spawn('npx', args, { stdio: ['pipe', 'inherit', 'inherit'], shell: true });
child.stdin.write(value);
child.stdin.end();
child.on('exit', (code) => process.exit(code || 0));
