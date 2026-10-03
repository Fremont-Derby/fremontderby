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
const parsed = new URL(databaseUrl);
const decodedPassword = decodeURIComponent(parsed.password || '');
const rawPassword = parsed.password || '';
const originalUser = decodeURIComponent(parsed.username || '');
if (!decodedPassword || !originalUser) {
  console.error('Migration apply failed closed.');
  process.exit(1);
}
const attempts = [...new Set([decodedPassword, rawPassword])].map((password) => ({ user: `postgres.${projectRef}`, password }));
console.log(plan.text);
console.log(`Stored database user is ${originalUser}.`);

function runPsql(file, user, password) {
  return new Promise((resolve) => {
    const child = spawn('psql', ['-v', 'ON_ERROR_STOP=1', '-f', file], {
      stdio: ['ignore', 'inherit', 'pipe'],
      env: {
        ...process.env,
        PGHOST: 'aws-1-us-west-2.pooler.supabase.com',
        PGPORT: '5432',
        PGUSER: user,
        PGPASSWORD: password,
        PGDATABASE: parsed.pathname.replace(/^\//, '') || 'postgres',
        PGSSLMODE: 'require',
      },
    });
    let errorText = '';
    child.stderr.on('data', (chunk) => {
      errorText += String(chunk).replace(password, '[redacted]');
    });
    child.on('exit', (status) => resolve({ status: status || 0, errorText }));
  });
}

for (const file of files) {
  let done = false;
  for (const attempt of attempts) {
    console.log(`Trying ${attempt.user}.`);
    const result = await runPsql(file, attempt.user, attempt.password);
    if (result.status === 0) {
      console.log(`Applied ${file}`);
      done = true;
      break;
    }
    if (/password authentication failed|no tenant identifier/i.test(result.errorText)) {
      console.log(`Rejected ${attempt.user}.`);
      continue;
    }
    if (result.errorText) process.stderr.write(result.errorText);
    console.error('Migration apply failed closed.');
    process.exit(1);
  }
  if (!done) {
    console.error('Migration apply failed closed.');
    process.exit(1);
  }
}
console.log('DRU migrations applied.');
