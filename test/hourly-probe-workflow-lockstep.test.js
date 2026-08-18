import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('hourly-live-probe schedules and probes all public hosts', () => {
  const yml = readFileSync('.github/workflows/hourly-live-probe.yml', 'utf8');
  assert.match(yml, /cron: '5 \* \* \* \*'/);
  assert.match(yml, /assert-production-dns\.mjs/);
  assert.match(yml, /hourly-live-probe\.mjs/);
  for (const host of [
    'https://fremontderby.com',
    'https://www.fremontderby.com',
    'https://dru.fremontderby.com',
    'https://jfl.fremontderby.com',
    'https://gamma.fremontderby.com',
  ]) {
    assert.match(yml, new RegExp(host.replace(/\./g, '\\.')));
  }
});
