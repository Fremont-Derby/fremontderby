import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { renderChatPage } from '../src/chatPage.js';

test('messages page offers Google sign-in and OAuth consume', () => {
  const html = renderChatPage({
    ENVIRONMENT: 'production',
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: 'pub',
  });
  assert.match(html, /data-google-signin/);
  assert.match(html, /Continue with Google/);
  assert.match(html, /function signInWithGoogle/);
  assert.match(html, /function consumeOAuthCallback/);
  assert.match(html, /redirect_to/);
  assert.match(html, /\/messages/);
});

test('profile preserves next path through Google redirect', () => {
  const src = readFileSync(new URL('../src/profilePage.js', import.meta.url), 'utf8');
  assert.match(src, /function safeNextPath/);
  assert.match(src, /next=/);
  assert.match(src, /window\.location\.replace\(next\)/);
});

test('rendered messages client script parses', async () => {
  const { writeFileSync, unlinkSync } = await import('node:fs');
  const { execFileSync } = await import('node:child_process');
  const html = renderChatPage({
    ENVIRONMENT: 'production',
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: 'pub',
  });
  const start = html.indexOf('const config =');
  const end = html.indexOf('</script>', start);
  const path = '/tmp/messages-client-syntax.js';
  writeFileSync(path, html.slice(start, end));
  execFileSync('node', ['--check', path]);
  try { unlinkSync(path); } catch {}
});
