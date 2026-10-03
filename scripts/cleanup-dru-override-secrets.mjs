#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { druOverrideSecretPlan } from '../src/druSecretCleanup.js';

const lane = process.argv[2] || '';
const present = (process.env.PRESENT_SECRET_NAMES || '').split(',').map((name) => name.trim()).filter(Boolean);
const plan = druOverrideSecretPlan(present, { ENVIRONMENT: lane });
if (!plan.ok) {
  console.error(plan.text);
  process.exit(lane === 'dru' ? 1 : 0);
}
console.log(plan.text);
for (const name of plan.delete) {
  if (name === plan.preserve) {
    console.error('Secret cleanup failed closed.');
    process.exit(1);
  }
  const code = await new Promise((resolve) => {
    const child = spawn('npx', ['--yes', 'wrangler@4', 'secret', 'delete', name, '--env', 'dru'], { stdio: 'inherit', shell: true });
    child.on('exit', (status) => resolve(status || 0));
  });
  if (code !== 0) {
    console.error('Secret cleanup failed closed.');
    process.exit(1);
  }
}
console.log('SUPABASE_SERVICE_ROLE_KEY preserved.');
