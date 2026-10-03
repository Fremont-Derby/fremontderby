#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { druMigrationApplyPlan } from '../src/druMigrationApply.js';

const projectRef = process.env.SUPABASE_PROJECT_REF || '';
const databaseUrl = process.env.DRU_DATABASE_URL || process.env.GAMMA_DATABASE_URL || '';
const files = [
  'supabase/migrations/20261003043000_dru_notification_rls.sql',
  'supabase/migrations/20261003043100_dru_admin_phone.sql',
];
const plan = druMigrationApplyPlan({ projectRef, sqlFiles: files });
if (!plan.ok) {
  console.error(plan.text);
  process.exit(1);
}
if (!databaseUrl.includes(projectRef)) {
  console.error('Migration apply failed closed.');
  process.exit(1);
}
console.log(plan.text);
for (const file of plan.files) {
  const code = await new Promise((resolve) => {
    const child = spawn('psql', [databaseUrl, '-v', 'ON_ERROR_STOP=1', '-f', file], { stdio: ['ignore', 'inherit', 'pipe'] });
    let errorText = '';
    child.stderr.on('data', (chunk) => {
      errorText += String(chunk).replace(databaseUrl, '[redacted]');
    });
    child.on('exit', (status) => {
      if (errorText) process.stderr.write(errorText);
      resolve(status || 0);
    });
  });
  if (code !== 0) {
    console.error('Migration apply failed closed.');
    process.exit(1);
  }
  console.log(`Applied ${file}`);
}
console.log('DRU migrations applied.');
