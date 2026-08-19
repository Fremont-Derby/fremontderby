import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('AGENTS.md requires RED -> GREEN -> REFACTOR before implementation', () => {
  const text = read('AGENTS.md');
  assert.match(text, /RED[^\n]*GREEN[^\n]*REFACTOR/i);
  assert.match(text, /fail(?:s|ing)? for the expected reason/i);
  assert.match(text, /before (?:writing|changing|editing) production|before implementation/i);
  assert.match(text, /domain rules[\s\S]*authorization[\s\S]*(?:API|HTTP)[\s\S]*(?:database|migration)[\s\S]*(?:UI|browser)[\s\S]*(?:config|deployment)/i);
  assert.match(text, /human onion validation[\s\S]*(?:outer|acceptance)/i);
  assert.match(text, /docs-only|documentation-only/i);
});

test('implementation card requires test-first evidence or a justified exception', () => {
  const text = read('.github/ISSUE_TEMPLATE/implementation-card.md');
  assert.match(text, /Test-first contract/i);
  assert.match(text, /RED evidence/i);
  assert.match(text, /GREEN evidence/i);
  assert.match(text, /Regression evidence/i);
  assert.match(text, /justified exception/i);
});

test('pull request template records RED, GREEN, regression, and refactor evidence', () => {
  const text = read('.github/pull_request_template.md');
  assert.match(text, /Test-driven evidence/i);
  assert.match(text, /RED evidence/i);
  assert.match(text, /GREEN evidence/i);
  assert.match(text, /Regression evidence/i);
  assert.match(text, /Refactor/i);
  assert.match(text, /justified exception/i);
});

test('Do work protocol uses the TDD inner loop instead of test-after coding', () => {
  const text = read('docs/do-work-protocol.md');
  assert.match(text, /RED[^\n]*GREEN[^\n]*REFACTOR/i);
  assert.match(text, /before (?:implementation|production code|changing behavior)/i);
  assert.match(text, /expected reason/i);
});
