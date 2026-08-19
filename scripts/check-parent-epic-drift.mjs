#!/usr/bin/env node
/**
 * #395 — report stale parent epic checkboxes vs child issue state.
 * Parents audited: #1 #2 #3 #4
 *
 * Usage:
 *   GITHUB_TOKEN=… node scripts/check-parent-epic-drift.mjs
 *   npm run check:epic-status
 *
 * Exit 0 = aligned; exit 1 = drift or API failure; exit 2 = missing token.
 */
import { fileURLToPath } from 'node:url';

export const DEFAULT_REPO = 'Fremont-Derby/fremontderby';
export const PARENT_EPICS = Object.freeze([1, 2, 3, 4]);

export function parseChecklist(body) {
  const lines = String(body || '').split(/\r?\n/);
  const items = [];
  for (const line of lines) {
    const m = line.match(/^\s*-\s*\[([ xX])\]\s*#(\d+)\b(.*)$/);
    if (!m) continue;
    items.push({
      checked: m[1].toLowerCase() === 'x',
      child: Number(m[2]),
      title: m[3].trim(),
      raw: line.trim(),
    });
  }
  return items;
}

export function evaluateChecklistDrift(items, childStates) {
  const drifts = [];
  for (const item of items) {
    const childState = childStates[item.child];
    if (!childState) continue;
    const childClosed = childState === 'closed';
    if (item.checked !== childClosed) {
      drifts.push({
        child: item.child,
        parentChecked: item.checked,
        childState,
        expectedChecked: childClosed,
      });
    }
  }
  return drifts;
}

async function gh(path, { repo, token, fetchImpl = fetch }) {
  const response = await fetchImpl(`https://api.github.com/repos/${repo}${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'fremontderby-epic-drift',
    },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${path} → HTTP ${response.status}: ${text.slice(0, 200)}`);
  }
  return response.json();
}

export async function auditParentEpics({
  token,
  repo = DEFAULT_REPO,
  parents = PARENT_EPICS,
  fetchImpl = fetch,
  log = console.log,
} = {}) {
  if (!token) {
    const error = new Error('check-parent-epic-drift: set GITHUB_TOKEN (or GH_TOKEN) to audit live issue state.');
    error.code = 'MISSING_TOKEN';
    throw error;
  }
  const drifts = [];
  for (const parentNum of parents) {
    const parent = await gh(`/issues/${parentNum}`, { repo, token, fetchImpl });
    const items = parseChecklist(parent.body);
    if (!items.length) {
      log(`#${parentNum} — no #N checklist rows (skip)`);
      continue;
    }
    log(`#${parentNum} [${parent.state}] ${parent.title} — ${items.length} checklist rows`);
    const childStates = {};
    for (const item of items) {
      const child = await gh(`/issues/${item.child}`, { repo, token, fetchImpl });
      childStates[item.child] = child.state;
      const childClosed = child.state === 'closed';
      const ok = item.checked === childClosed;
      const mark = ok ? 'ok' : 'DRIFT';
      log(
        `  [${mark}] parent ${item.checked ? 'x' : ' '} #${item.child} child=${child.state} ${child.title}`,
      );
    }
    for (const drift of evaluateChecklistDrift(items, childStates)) {
      drifts.push({ parent: parentNum, ...drift });
    }
  }
  return drifts;
}

const isDirect = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirect) {
  const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || process.env.GH_PAT || '';
  const REPO = process.env.GITHUB_REPOSITORY || DEFAULT_REPO;
  try {
    const drifts = await auditParentEpics({ token: TOKEN, repo: REPO });
    if (drifts.length) {
      console.error('\nParent/child checklist drift detected:');
      for (const d of drifts) {
        console.error(
          `  #${d.parent} marks #${d.child} as ${d.parentChecked ? 'done' : 'open'} but child is ${d.childState} (expected checked=${d.expectedChecked})`,
        );
      }
      process.exitCode = 1;
    } else {
      console.log('\nAll audited parent checklists match child issue state.');
    }
  } catch (error) {
    if (error?.code === 'MISSING_TOKEN') {
      console.error(error.message);
      process.exitCode = 2;
    } else {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    }
  }
}
