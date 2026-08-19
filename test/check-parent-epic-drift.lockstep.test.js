import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_REPO,
  PARENT_EPIC_NUMBERS,
  parseChecklist,
  evaluateChecklistDrift,
  auditParentEpics,
} from '../scripts/check-parent-epic-drift.mjs';

test('default repo and parent epic list are locked', () => {
  assert.equal(DEFAULT_REPO, 'Fremont-Derby/fremontderby');
  assert.deepEqual([...PARENT_EPIC_NUMBERS], [1, 2, 3, 4]);
});

test('parseChecklist extracts checked state, child number, and title', () => {
  const body = [
    '## Work',
    '- [x] #10 Done item',
    '- [ ] #11 Open item',
    '- [X] #12 Uppercase checked',
    'not a checklist',
    '- [x] no-issue',
  ].join('\n');
  const items = parseChecklist(body);
  assert.deepEqual(
    items.map((i) => ({ checked: i.checked, child: i.child, title: i.title })),
    [
      { checked: true, child: 10, title: 'Done item' },
      { checked: false, child: 11, title: 'Open item' },
      { checked: true, child: 12, title: 'Uppercase checked' },
    ],
  );
  assert.deepEqual(parseChecklist(''), []);
});

test('evaluateChecklistDrift flags parent/child misalignment', () => {
  const items = parseChecklist('- [x] #10 Done\n- [ ] #11 Open\n');
  const drifts = evaluateChecklistDrift(1, items, { 10: 'open', 11: 'closed' });
  assert.equal(drifts.length, 2);
  assert.equal(drifts[0].child, 10);
  assert.equal(drifts[0].expectedChecked, false);
  assert.equal(drifts[1].child, 11);
  assert.equal(drifts[1].expectedChecked, true);

  assert.deepEqual(
    evaluateChecklistDrift(1, items, { 10: 'closed', 11: 'open' }),
    [],
  );
});

test('auditParentEpics returns exitCode 2 without token', async () => {
  const result = await auditParentEpics({ token: '' });
  assert.equal(result.exitCode, 2);
  assert.equal(result.ok, false);
});

test('auditParentEpics reports drift via injected fetch', async () => {
  const issues = {
    1: { state: 'open', title: 'Epic', body: '- [x] #10 Child' },
    10: { state: 'open', title: 'Child still open' },
  };
  const result = await auditParentEpics({
    token: 't',
    repo: 'Fremont-Derby/fremontderby',
    parents: [1],
    log: () => {},
    fetchImpl: async (url) => {
      const id = Number(url.split('/').pop());
      return new Response(JSON.stringify(issues[id]), { status: 200 });
    },
  });
  assert.equal(result.ok, false);
  assert.equal(result.exitCode, 1);
  assert.equal(result.drifts[0].child, 10);
});
