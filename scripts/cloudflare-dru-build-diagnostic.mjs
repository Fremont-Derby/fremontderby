import { readFile } from 'node:fs/promises';

const CF_ROOT = 'https://api.cloudflare.com/client/v4';
const GH_ROOT = 'https://api.github.com';
const accountId = String(process.env.CLOUDFLARE_ACCOUNT_ID || '').trim();
const cfToken = String(process.env.CLOUDFLARE_BUILDS_API_TOKEN || '').trim();
const ghToken = String(process.env.GITHUB_TOKEN || '').trim();
const repo = process.env.GITHUB_REPOSITORY || 'Fremont-Derby/fremontderby';
if (!accountId || !cfToken || !ghToken) throw new Error('Required diagnostic credentials are missing.');

async function cf(path) {
  const response = await fetch(`${CF_ROOT}/accounts/${accountId}${path}`, {
    headers: { Authorization: `Bearer ${cfToken}`, 'Content-Type': 'application/json' },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    const message = (payload.errors || []).map((x) => x?.message).filter(Boolean).join('; ') || 'unknown error';
    throw new Error(`Cloudflare GET ${path} failed (${response.status}): ${message}`);
  }
  return payload.result;
}

function meta(build) {
  return build?.build_trigger_metadata || {};
}

function normalizeBuilds(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.builds)) return result.builds;
  if (Array.isArray(result?.items)) return result.items;
  return [];
}

function redact(input) {
  return String(input || '')
    .replace(/Bearer\s+\S+/gi, 'Bearer <redacted>')
    .replace(/\b(sb_(?:publishable|secret)_[A-Za-z0-9_-]+)\b/g, '<redacted-supabase-key>')
    .replace(/\beyJ[A-Za-z0-9_.-]{20,}\b/g, '<redacted-jwt>')
    .replace(/\b((?:token|secret|password|api[_ -]?key)\s*[:=]\s*)\S+/gi, '$1<redacted>');
}

async function postIssue(issue, body) {
  const response = await fetch(`${GH_ROOT}/repos/${repo}/issues/${issue}/comments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ghToken}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ body }),
  });
  if (!response.ok) throw new Error(`GitHub issue comment failed (${response.status})`);
}

async function main() {
  const config = JSON.parse(await readFile(new URL('../config/cloudflare-workers-builds.json', import.meta.url), 'utf8'));
  const desired = config.workers.dru;
  const scripts = await cf('/workers/scripts');
  const worker = (scripts || []).find((item) => (desired.workerNames || []).includes(item?.id));
  if (!worker?.tag) throw new Error('Could not resolve DRU Worker tag.');

  const builds = normalizeBuilds(await cf(`/builds/workers/${encodeURIComponent(worker.tag)}/builds`));
  const failed = builds
    .filter((build) => build?.build_outcome === 'fail' && meta(build).branch === desired.branch)
    .sort((a, b) => new Date(b.created_on || 0) - new Date(a.created_on || 0))[0];
  if (!failed?.build_uuid) throw new Error('No failed DRU build was found in current build history.');

  const logs = await cf(`/builds/builds/${encodeURIComponent(failed.build_uuid)}/logs`);
  const messages = (logs?.lines || []).map((line) => {
    if (Array.isArray(line)) return line.slice(1).join(' ');
    return String(line || '');
  });
  const interesting = messages
    .filter((line) => /error|fail|refus|wrangler|deploy|branch|missing|required|not found|permission|unauthor|npm err|command/i.test(line))
    .slice(-80)
    .map(redact);
  const fallback = messages.slice(-40).map(redact);
  const excerpt = (interesting.length ? interesting : fallback).join('\n').slice(0, 12000);

  const body = [
    '## DRU Cloudflare failed-build diagnostic',
    '',
    `- Worker: \`${worker.id}\``,
    `- Build UUID: \`${failed.build_uuid}\``,
    `- Commit: \`${meta(failed).commit_hash || ''}\``,
    `- Branch: \`${meta(failed).branch || ''}\``,
    `- Source label: \`${meta(failed).build_trigger_source || ''}\``,
    `- Outcome: \`${failed.build_outcome}\``,
    `- Deploy command: \`${meta(failed).deploy_command || ''}\``,
    '',
    '### Sanitized relevant Cloudflare log lines',
    '```text',
    excerpt || '<no log lines returned>',
    '```',
    '',
    'Diagnostic only: this run did not mutate the DRU Git branch or trigger another DRU build.',
  ].join('\n');

  await postIssue(1192, body);
  await postIssue(1189, body);
  console.log(body);
}

main().catch(async (error) => {
  const message = redact(error instanceof Error ? error.message : String(error));
  console.error(message);
  try { await postIssue(1192, `## DRU build diagnostic failed\n\n\`${message}\``); } catch {}
  process.exitCode = 1;
});
