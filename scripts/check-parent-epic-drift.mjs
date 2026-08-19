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
export const PARENT_EPIC_NUMBERS = Object.freeze([1, 2, 3, 4]);

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

/**
 * Compare parent checklist rows to child issue states.
 * childStates: Map or object of childNumber → 'open' | 'closed'
 */
export function evaluateChecklistDrift(parentNum, checklistItems, childStates) {
  const drifts = [];
  for (const item of checklistItems) {
    const state = childStates instanceof Map
      ? childStates.get(item.child)
      : childStates[item.child];
    if (state !== 'open' && state !== 'closed') {
      drifts.push({
        parent: parentNum,
        child: item.child,
        parentChecked: item.checked,
        childState: state ?? 'unknown',
        expectedChecked: null,
        error: `missing child state for #${item.child}`,
      });
      continue;
    }
    const childClosed = state === 'closed';
    const ok = item.checked === childClosed;
    if (!ok) {
      drifts.push({
        parent: parentNum,
        child: item.child,
        parentChecked: item.checked,
        childState: state,
        expectedChecked: childClosed,
      });
    }
  }
  return drifts;
}

export async function auditParentEpics({
  repo = process.env.GITHUB_REPOSITORY || DEFAULT_REPO,
  token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || process.env.GH_PAT || '',
  parents = PARENT_EPIC_NUMBERS,
  fetchImpl = fetch,
  log = console.log,
} = {}) {
  if (!token) {
    return { ok: false, exitCode: 2, drifts: [], error: 'missing token' };
  }

  async function gh(path) {
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

  const drifts = [];
  for (const parentNum of parents) {
    const parent = await gh(`/issues/${parentNum}`);
    const items = parseChecklist(parent.body);
    if (!items.length) {
      log(`#${parentNum} — no #N checklist rows (skip)`);
      continue;
    }
    log(`#${parentNum} [${parent.state}] ${parent.title} — ${items.length} checklist rows`);

    const childStates = new Map();
    for (const item of items) {
      const child = await gh(`/issues/${item.child}`);
      childStates.set(item.child, child.state);
      const childClosed = child.state === 'closed';
      const ok = item.checked === childClosed;
      log(
        `  [${ok ? 'ok' : 'DRIFT'}] parent ${item.checked ? 'x' : ' '} #${item.child} child=${child.state} ${child.title}`,
      );
    }
    drifts.push(...evaluateChecklistDrift(parentNum, items, childStates));
  }

  return { ok: drifts.length === 0, exitCode: drifts.length ? 1 : 0, drifts };
}

const isDirect = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirect) {
  try {
    const result = await auditParentEpics();
    if (result.exitCode === 2) {
      console.error('check-parent-epic-drift: set GITHUB_TOKEN (or GH_TOKEN) to audit live issue state.');
      process.exitCode = 2;
    } else if (!result.ok) {
      console.error('\nParent/child checklist drift detected:');
      for (const d of result.drifts) {
        console.error(
          `  #${d.parent} marks #${d.child} as ${d.parentChecked ? 'done' : 'open'} but child is ${d.childState} (expected checked=${d.expectedChecked})`,
        );
      }
      process.exitCode = 1;
    } else {
      console.log('\nAll audited parent checklists match child issue state.');
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
