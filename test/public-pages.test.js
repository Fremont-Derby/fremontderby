import test from 'node:test';
import assert from 'node:assert/strict';
import { renderIntroPage, renderRulesPage } from '../src/publicPages.js';

test('intro page links to the league rules and standings', () => {
  const html = renderIntroPage();
  assert.match(html, /Fremont Derby/);
  assert.match(html, /Read the rules/);
  assert.match(html, /href="\/rules"/);
  assert.match(html, /href="\/standings"/);
});

test('rulebook states flexible scheduling and dual score confirmation', () => {
  const html = renderRulesPage();
  assert.match(html, /play early, late, out of round order/);
  assert.match(html, /Both players' rack records must agree/);
  assert.match(html, /There is no team-strength or Fargo cap/);
});
