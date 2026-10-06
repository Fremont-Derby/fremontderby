import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('playoffs do not invent results before the regular season is complete', () => {
  const source = fs.readFileSync(new URL('../src/playoffHttp.js', import.meta.url), 'utf8');
  const ready = source.indexOf('practicePlayoffsReady(rows)');
  const write = source.indexOf('await writeDruPracticeResults');
  assert.ok(ready > 0 && write > ready);
  assert.match(source, /All seven regular-season matchups must be complete before playoffs/);
});
