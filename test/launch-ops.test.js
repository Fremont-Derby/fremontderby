import test from 'node:test';
import assert from 'node:assert/strict';
import { launchRunbook, nightFallback, noticeLink, tapTarget, writeState } from '../src/launchOps.js';

test('the launch runbook has four steps', () => {
  assert.equal(launchRunbook().length, 4);
});

test('a notice without a link opens the schedule', () => {
  assert.equal(noticeLink({}).href, '/schedule');
  assert.equal(noticeLink({ href: '/teams' }).href, '/teams');
});

test('a write says pending, saved, or failed', () => {
  assert.equal(writeState('failed').text, 'Not saved');
});

test('a tap target must be at least 44 pixels', () => {
  assert.equal(tapTarget({ size: 40 }).ok, false);
  assert.equal(tapTarget({ size: 44 }).ok, true);
});

test('a down night is read-only', () => {
  assert.equal(nightFallback(true).mode, 'read-only');
});
