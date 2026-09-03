import { readFile } from 'node:fs/promises';

const CF_ROOT = 'https://api.cloudflare.com/client/v4';
const GH_ROOT = 'https://api.github.com';
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const cfToken = process.env.CLOUDFLARE_BUILDS_API_TOKEN;
const ghToken = process.env.GITHUB_TOKEN;
const repo = process.env.GITHUB_REPOSITORY || 'Fremont-Derby/fremontderby';
const productionProbeSha = process.env.PRODUCTION_PROBE_SHA || process.env.GITHUB_SHA;
const jflProbeSha = process.env.JFL_PROBE_SHA;
const jflFeatureProbeSha = process.env.JFL_FEATURE_PROBE_SHA;

function requireValue(name, value) {
  if (!String(value || '').trim()) throw new Error(`${name} is required`);
  return String(value).trim();
}

requireValue('CLOUDFLARE_ACCOUNT_ID', accountId);
requireValue('CLOUDFLARE_BUILDS_API_TOKEN', cfToken);
requireValue('GITHUB_TOKEN', ghToken);
requireValue('PRODUCTION_PROBE_SHA', productionProbeSha);
requireValue('JFL_PROBE_SHA', jflProbeSha);
requireValue('JFL_FEATURE_PROBE_SHA', jflFeatureProbeSha);

async function cf(path, options = {}) {
  const response = await fetch(`${CF_ROOT}/accounts/${accountId}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${cfToken}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    const message = (payload.errors || []).map((x) => x?.message).filter(Boolean).join('; ') || 'unknown error';
    throw new Error(`Cloudflare ${options.method || 'GET'} ${path} failed (${response.status}): ${message}`);
  }
  return payload.result;
}

function normalizeBuilds(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.builds)) return result.builds;
  if (Array.isArray(result?.items)) return result.items;
  return [];
}

function meta(build) {
  return build?.build_trigger_metadata || {};
}

function summarizeBuild(build) {
  return {
    build_uuid: build?.build_uuid || null,
    status: build?.status || null,
    outcome: build?.build_outcome || null,
    created_on: build?.created_on || null,
    branch: meta(build).branch || null,
    commit_hash: meta(build).commit_hash || null,
    source: meta(build).build_trigger_source || null,
    deploy_command: meta(build).deploy_command || null,
  };
}

async function loadLaneState() {
  const config = JSON.parse(await readFile(new URL('../config/cloudflare-workers-builds.json', import.meta.url), 'utf8'));
  const scripts = await cf('/workers/scripts');
  const lanes = {};
  for (const [lane, desired] of Object.entries(config.workers)) {
    const worker = (scripts || []).find((item) => (desired.workerNames || []).includes(item?.id));
    if (!worker?.tag) throw new Error(`Could not resolve Worker script for ${lane}`);
    const triggers = await cf(`/builds/workers/${encodeURIComponent(worker.tag)}/triggers`);
    const active = (triggers || []).filter((trigger) => !trigger?.deleted_on);
    const trigger = active.find((item) => {
      const includes = item?.branch_includes || [];
      return includes.length === 1 && includes[0] === desired.branch;
    });
    if (!trigger?.trigger_uuid) throw new Error(`Could not resolve exact release trigger for ${lane}`);
    lanes[lane] = { lane, desired, worker, trigger };
  }
  return lanes;
}

async function listBuilds(laneState) {
  return normalizeBuilds(await cf(`/builds/workers/${encodeURIComponent(laneState.worker.tag)}/builds`));
}

async function waitForBuildByCommit(laneState, sha, timeoutMs = 300000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const builds = await listBuilds(laneState);
    const build = builds.find((item) => meta(item).commit_hash === sha);
    if (build && build.status === 'stopped') return build;
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  throw new Error(`Timed out waiting for ${laneState.lane} build for ${sha}`);
}

async function waitForBuildUuid(uuid, timeoutMs = 300000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const build = await cf(`/builds/builds/${encodeURIComponent(uuid)}`);
    if (build?.status === 'stopped') return build;
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  throw new Error(`Timed out waiting for build ${uuid}`);
}

async function buildsByCommitAcrossLanes(lanes, sha) {
  const matches = {};
  for (const [lane, state] of Object.entries(lanes)) {
    const builds = await listBuilds(state);
    matches[lane] = builds.filter((item) => meta(item).commit_hash === sha).map(summarizeBuild);
  }
  return matches;
}

async function assertCommitAbsentAll(lanes, sha) {
  const matches = await buildsByCommitAcrossLanes(lanes, sha);
  const offenders = Object.entries(matches).filter(([, list]) => list.length > 0).map(([lane]) => lane);
  if (offenders.length) throw new Error(`${sha} feature-branch SHA unexpectedly appeared in build history for: ${offenders.join(', ')}`);
  return matches;
}

async function assertOnlyLaneHasCommit(lanes, expectedLane, sha) {
  const matches = await buildsByCommitAcrossLanes(lanes, sha);
  const offenders = Object.entries(matches)
    .filter(([lane, list]) => lane !== expectedLane && list.length > 0)
    .map(([lane]) => lane);
  if (!matches[expectedLane]?.length) throw new Error(`${expectedLane} has no build for ${sha}`);
  if (offenders.length) throw new Error(`${sha} unexpectedly appeared in build history for: ${offenders.join(', ')}`);
  return matches;
}

async function probeEnvironment(host, expected) {
  const response = await fetch(`https://${host}/health/environment?probe=${Date.now()}`, { redirect: 'manual' });
  const text = await response.text();
  let body = {};
  try { body = JSON.parse(text); } catch {}
  const actual = String(body.environment || body.ENVIRONMENT || '');
  if (response.status !== 200 || actual !== expected) {
    throw new Error(`${host} identity mismatch: status=${response.status} environment=${actual || '<empty>'}`);
  }
  return { host, status: response.status, environment: actual };
}

async function postIssueComment(body) {
  const response = await fetch(`${GH_ROOT}/repos/${repo}/issues/1192/comments`, {
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

function asCode(value) {
  return `\`${String(value ?? '')}\``;
}

async function main() {
  const lanes = await loadLaneState();

  await assertCommitAbsentAll(lanes, jflFeatureProbeSha);

  const jflBuild = await waitForBuildByCommit(lanes.jfl, jflProbeSha);
  if (jflBuild.build_outcome !== 'success') throw new Error(`JFL probe build outcome is ${jflBuild.build_outcome}`);
  if (meta(jflBuild).branch !== lanes.jfl.desired.branch) throw new Error('JFL probe built from wrong branch');
  if (meta(jflBuild).deploy_command !== lanes.jfl.desired.deployCommand) throw new Error('JFL probe used wrong deploy command');
  await assertOnlyLaneHasCommit(lanes, 'jfl', jflProbeSha);

  const productionBuild = await waitForBuildByCommit(lanes.production, productionProbeSha);
  if (productionBuild.build_outcome !== 'success') throw new Error(`Production probe build outcome is ${productionBuild.build_outcome}`);
  if (meta(productionBuild).branch !== lanes.production.desired.branch) throw new Error('Production probe built from wrong branch');
  if (meta(productionBuild).deploy_command !== lanes.production.desired.deployCommand) throw new Error('Production probe used wrong deploy command');
  await assertOnlyLaneHasCommit(lanes, 'production', productionProbeSha);

  const druStart = new Date();
  const manual = await cf(`/builds/triggers/${encodeURIComponent(lanes.dru.trigger.trigger_uuid)}/builds`, {
    method: 'POST',
    body: JSON.stringify({ branch: lanes.dru.desired.branch }),
  });
  const druBuildUuid = manual?.build_uuid;
  if (!druBuildUuid) throw new Error('DRU manual build did not return build_uuid');
  const druBuild = await waitForBuildUuid(druBuildUuid);
  if (druBuild.build_outcome !== 'success') throw new Error(`DRU hosted redeploy outcome is ${druBuild.build_outcome}`);
  if (meta(druBuild).branch !== lanes.dru.desired.branch) throw new Error('DRU hosted redeploy built from wrong branch');
  if (meta(druBuild).deploy_command !== lanes.dru.desired.deployCommand) throw new Error('DRU hosted redeploy used wrong deploy command');

  const druCommit = meta(druBuild).commit_hash;
  for (const lane of ['production', 'jfl', 'gamma']) {
    const builds = await listBuilds(lanes[lane]);
    const unexpected = builds.find((item) => {
      const created = item?.created_on ? new Date(item.created_on) : new Date(0);
      return created >= new Date(druStart.getTime() - 5000) && meta(item).commit_hash === druCommit;
    });
    if (unexpected) throw new Error(`DRU manual redeploy unexpectedly appeared in ${lane} build history`);
  }

  const health = [];
  health.push(await probeEnvironment('jfl.fremontderby.com', 'jfl'));
  health.push(await probeEnvironment('dru.fremontderby.com', 'dru'));
  health.push(await probeEnvironment('gamma.fremontderby.com', 'gamma'));
  health.push(await probeEnvironment('fremontderby.com', 'production'));

  const lines = [
    '## Hosted Cloudflare lane-isolation proof — PASS',
    '',
    `- JFL feature-branch probe SHA: ${asCode(jflFeatureProbeSha)} — absent from all four Workers Builds histories.`,
    `- JFL permanent-branch probe SHA: ${asCode(jflProbeSha)}`,
    `- JFL build UUID: ${asCode(jflBuild.build_uuid)}; source-label=${asCode(meta(jflBuild).build_trigger_source)}; outcome=${asCode(jflBuild.build_outcome)}; deploy=${asCode(meta(jflBuild).deploy_command)}`,
    '- JFL permanent probe SHA appears in JFL build history and in no Production/DRU/Gamma build history.',
    `- Main production probe SHA: ${asCode(productionProbeSha)}`,
    `- Production build UUID: ${asCode(productionBuild.build_uuid)}; source-label=${asCode(meta(productionBuild).build_trigger_source)}; outcome=${asCode(productionBuild.build_outcome)}; deploy=${asCode(meta(productionBuild).deploy_command)}`,
    '- Main probe SHA appears in Production build history and in no JFL/DRU/Gamma build history.',
    `- DRU branch was not mutated. Cloudflare rebuilt configured branch ${asCode(lanes.dru.desired.branch)} through trigger ${asCode(lanes.dru.trigger.trigger_uuid)}.`,
    `- DRU build UUID: ${asCode(druBuild.build_uuid)}; commit=${asCode(druCommit)}; source-label=${asCode(meta(druBuild).build_trigger_source)}; outcome=${asCode(druBuild.build_outcome)}; deploy=${asCode(meta(druBuild).deploy_command)}`,
    '- No matching DRU redeploy appeared in Production/JFL/Gamma build histories during the verification window.',
    '',
    '### Live environment identity',
    ...health.map((item) => `- ${item.host}: HTTP ${item.status}, environment=${asCode(item.environment)}`),
    '',
    'Cloudflare source labels are recorded as evidence but are not used as the isolation decision: exact branch, exact commit, deploy command, cross-lane history, build outcome, and live runtime identity are authoritative for this proof.',
  ];
  await postIssueComment(lines.join('\n'));
  console.log(lines.join('\n'));
}

main().catch(async (error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  try {
    await postIssueComment(`## Hosted Cloudflare lane-isolation proof — FAIL\n\nFailure: ${asCode(message)}\n\nNo secret values were logged. Keep #1192 open.`);
  } catch (commentError) {
    console.error(commentError instanceof Error ? commentError.message : commentError);
  }
  process.exitCode = 1;
});
