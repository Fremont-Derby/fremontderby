import assert from 'node:assert/strict';
import test from 'node:test';
import { readdirSync, writeFileSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { livePageRefreshScript } from '../src/livePageRefresh.js';

const env = {
  ENVIRONMENT: 'production',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'pub',
  SUPABASE_SERVICE_ROLE_KEY: 'service',
};

function inlineScripts(html) {
  const out = [];
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    if (/\bsrc\s*=/.test(m[1] || '')) continue;
    const body = (m[2] || '').trim();
    if (body) out.push(body);
  }
  return out;
}

function assertParses(label, source) {
  const path = `/tmp/syntax-${label.replace(/[^a-z0-9]+/gi, '_')}.js`;
  writeFileSync(path, source);
  try {
    execFileSync('node', ['--check', path], { stdio: 'pipe' });
  } finally {
    try { unlinkSync(path); } catch {}
  }
}

test('rendered page client scripts parse', async () => {
  const files = readdirSync(new URL('../src/', import.meta.url)).filter((f) => f.endsWith('Page.js'));
  let checked = 0;
  for (const file of files) {
    const mod = await import(pathToFileURL(new URL(`../src/${file}`, import.meta.url).pathname).href);
    for (const name of Object.keys(mod).filter((k) => typeof mod[k] === 'function' && /^render/i.test(k))) {
      let html;
      try {
        try { html = mod[name](env); } catch { html = mod[name](); }
      } catch {
        continue;
      }
      if (typeof html !== 'string') continue;
      for (const [i, body] of inlineScripts(html).entries()) {
        assertParses(`${file}_${name}_${i}`, body);
        checked += 1;
      }
    }
  }
  assert.ok(checked > 10, `expected multiple page scripts, got ${checked}`);
});

test('livePageRefresh script parses', () => {
  const body = livePageRefreshScript.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, '');
  assertParses('livePageRefresh', body);
  assert.match(body, /path\.includes\('\/api\/me\/contact'\)/);
});
