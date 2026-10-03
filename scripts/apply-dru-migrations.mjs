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
const regions = ['us-west-2', 'us-east-1', 'us-east-2', 'eu-west-1', 'eu-central-1', 'ap-southeast-1', 'ap-northeast-1'];
const plan = druMigrationApplyPlan({ projectRef, sqlFiles: files });
if (!plan.ok) {
  console.error(plan.text);
  process.exit(1);
}
if (!databaseUrl.includes(projectRef)) {
  console.error('Migration apply failed closed.');
  process.exit(1);
}

function redact(text) {
  return String(text).replace(databaseUrl, '[redacted]').replace(/postgres(?:\.[a-z0-9]+)?:[^@\s]+@/gi, 'postgres:[redacted]@');
}

function poolerUrls(raw) {
  const url = new URL(raw);
  if (!url.hostname.startsWith('db.')) return [raw];
  const user = url.username.includes('.') ? url.username : `${url.username}.${projectRef}`;
  return regions.map((region) => {
    const next = new URL(raw);
    next.username = user;
    next.hostname = `aws-0-${region}.pooler.supabase.com`;
    next.port = '5432';
    return next.toString();
  });
}

function runPsql(url, file) {
  return new Promise((resolve) => {
    const child = spawn('psql', [url, '-v', 'ON_ERROR_STOP=1', '-f', file], { stdio: ['ignore', 'inherit', 'pipe'] });
    let errorText = '';
    child.stderr.on('data', (chunk) => {
      errorText += redact(chunk);
    });
    child.on('exit', (status) => resolve({ status: status || 0, errorText }));
  });
}

console.log(plan.text);
const candidates = poolerUrls(databaseUrl);
let applied = false;
for (const file of plan.files) {
  let done = false;
  for (const url of candidates) {
    const result = await runPsql(url, file);
    if (result.status === 0) {
      console.log(`Applied ${file}`);
      done = true;
      applied = true;
      break;
    }
    const host = new URL(url).hostname;
    if (/tenant\/user|ENOTFOUND|Network is unreachable|could not translate|timeout|Connection refused/i.test(result.errorText)) {
      console.log(`Missed ${host}`);
      continue;
    }
    if (result.errorText) {
      process.stderr.write(result.errorText);
      console.error('Migration apply failed closed.');
      process.exit(1);
    }
  }
  if (!done) {
    console.error('Migration apply failed closed.');
    process.exit(1);
  }
}
if (!applied) {
  console.error('Migration apply failed closed.');
  process.exit(1);
}
console.log('DRU migrations applied.');
