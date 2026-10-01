import test from 'node:test';
import assert from 'node:assert/strict';
import { backupRestore, dedupeNotice, noticeLink } from '../src/readGate.js';
test('a restore must be rehearsed and served', () => { assert.equal(backupRestore({ taken: true, restored: true }).ok, false); });
test('repeated notices collapse', () => {
  const rows = dedupeNotice([{ title: 'Score', body: 'in' }, { title: 'Score', body: 'in' }]);
  assert.equal(rows.length, 1);
});
test('a dead notice link falls back to the schedule', () => { assert.equal(noticeLink({}).href, '/schedule'); });
