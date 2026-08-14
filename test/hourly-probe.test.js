import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { probeHost, formatProbeMarkdown, runHourlyProbes } from '../src/hourlyProbe.js';

test('probeHost records ok and fail statuses', async () => {
  const calls = [];
  const summary = await probeHost('https://example.test', ['/', '/trades'], {
    fetch: async (url) => {
      calls.push(url);
      if (String(url).endsWith('/trades')) return new Response('', { status: 404 });
      return new Response('', { status: 200 });
    },
  });
  assert.equal(summary.results.length, 2);
  assert.equal(summary.failures.length, 1);
  assert.equal(calls.length, 2);
});

test('formatProbeMarkdown includes failure marker', () => {
  const md = formatProbeMarkdown({
    ok: false,
    checkedAt: '2026-08-14T00:00:00.000Z',
    reports: [{
      host: 'https://fremontderby.com',
      results: [{ url: 'https://fremontderby.com/trades', status: 404, ok: false, ms: 12 }],
      failures: [{ url: 'https://fremontderby.com/trades', status: 404, ok: false, ms: 12 }],
    }],
    failures: [{ url: 'https://fremontderby.com/trades', status: 404 }],
  });
  assert.match(md, /FAIL/);
  assert.match(md, /trades/);
});

test('wrangler and routerEntry wire cron', () => {
  const wrangler = readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8');
  const entry = readFileSync(new URL('../src/routerEntry.js', import.meta.url), 'utf8');
  assert.match(wrangler, /"crons"/);
  assert.match(entry, /async scheduled\(/);
  assert.match(entry, /runHourlyProbes/);
});
