import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseChecklist,
  evaluateChecklistDrift,
  DEFAULT_REPO,
  PARENT_EPICS,
} from '../scripts/check-parent-epic-drift.mjs';

test('DEFAULT_REPO points at Fremont-Derby org and parents are 1-4', () => {
  assert.equal(DEFAULT_REPO, 'Fremont-Derby/fremontderby');
  assert.deepEqual([...PARENT_EPICS], [1, 2, 3, 4]);
});

test('parseChecklist extracts checked and open #N rows', () => {
  const body = [
    '## Children',
    '- [x] #10 Done child',
    '- [ ] #11 Open child',
    '- [X] #12 Uppercase x',
    'not a checklist',
    '- [ ] missing number',
  ].join('\n');
  const items = parseChecklist(body);
  assert.equal(items.length, 3);
  assert.deepEqual(items[0], {
    checked: true,
    child: 10,
    title: 'Done child',
    raw: '- [x] #10 Done child',
  });
  assert.equal(items[1].checked, false);
  assert.equal(items[1].child, 11);
  assert.equal(items[2].checked, true);
  assert.equal(items[2].child, 12);
});

test('evaluateChecklistDrift detects parent/child mismatches', () => {
  const items = parseChecklist('- [x] #10\n- [ ] #11');
  const drifts = evaluateChecklistDrift(items, { 10: 'open', 11: 'closed' });
  assert.equal(drifts.length, 2);
  assert.equal(drifts[0].child, 10);
  assert.equal(drifts[0].expectedChecked, false);
  assert.equal(drifts[1].child, 11);
  assert.equal(drifts[1].expectedChecked, true);
  assert.deepEqual(evaluateChecklistDrift(items, { 10: 'closed', 11: 'open' }), []);
});
