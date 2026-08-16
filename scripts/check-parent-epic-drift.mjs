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
const REPO = process.env.GITHUB_REPOSITORY || 'subiki/fremontderby';
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || process.env.GH_PAT || '';
const PARENTS = [1, 2, 3, 4];

if (!TOKEN) {
  console.error('check-parent-epic-drift: set GITHUB_TOKEN (or GH_TOKEN) to audit live issue state.');
  process.exit(2);
}

async function gh(path) {
  const response = await fetch(`https://api.github.com/repos/${REPO}${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${TOKEN}`,
      'User-Agent': 'fremontderby-epic-drift',
    },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${path} → HTTP ${response.status}: ${text.slice(0, 200)}`);
  }
  return response.json();
}

function parseChecklist(body) {
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

const drifts = [];
for (const parentNum of PARENTS) {
  const parent = await gh(`/issues/${parentNum}`);
  const items = parseChecklist(parent.body);
  if (!items.length) {
    console.log(`#${parentNum} — no #N checklist rows (skip)`);
    continue;
  }
  console.log(`#${parentNum} [${parent.state}] ${parent.title} — ${items.length} checklist rows`);
  for (const item of items) {
    const child = await gh(`/issues/${item.child}`);
    const childClosed = child.state === 'closed';
    const ok = item.checked === childClosed;
    const mark = ok ? 'ok' : 'DRIFT';
    console.log(
      `  [${mark}] parent ${item.checked ? 'x' : ' '} #${item.child} child=${child.state} ${child.title}`,
    );
    if (!ok) {
      drifts.push({
        parent: parentNum,
        child: item.child,
        parentChecked: item.checked,
        childState: child.state,
        expectedChecked: childClosed,
      });
    }
  }
}

if (drifts.length) {
  console.error('\nParent/child checklist drift detected:');
  for (const d of drifts) {
    console.error(
      `  #${d.parent} marks #${d.child} as ${d.parentChecked ? 'done' : 'open'} but child is ${d.childState} (expected checked=${d.expectedChecked})`,
    );
  }
  process.exit(1);
}

console.log('\nAll audited parent checklists match child issue state.');
