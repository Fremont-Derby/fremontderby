import assert from 'node:assert/strict';
import test from 'node:test';

import { renderPrimaryNavigation } from '../src/appShell.js';

function extractNav(html, className) {
  const match = html.match(new RegExp(`<nav class="${className}"[^>]*>[\\s\\S]*?<\\/nav>`));
  return match?.[0] || '';
}

function currentKeys(fragment) {
  return [...fragment.matchAll(/data-nav-key="([^"]+)"[^>]*aria-current="page"/g)]
    .map((match) => match[1]);
}

const routeMatrix = [
  ['/', 'home'],
  ['/rules', 'rules'],
  ['/demo', 'demo'],
  ['/sandbox/player', 'demo'],
  ['/sandbox/captain', 'demo'],
  ['/teams', 'teams'],
  ['/teams/example', 'teams'],
  ['/availability', 'teams'],
  ['/lineup', 'teams'],
  ['/schedule', 'schedule'],
  ['/schedule/example', 'schedule'],
  ['/standings', 'standings'],
  ['/standings/example', 'standings'],
  ['/prizes', 'prizes'],
  ['/scorecard', 'score'],
  ['/scorecard/live', 'score'],
  ['/messages', 'messages'],
  ['/messages/moderation', 'messages'],
  ['/admin', 'admin'],
  ['/admin/players', 'admin'],
  ['/admin/season-teams', 'admin'],
  ['/profile', 'profile'],
  ['/profile/example', 'profile'],
];

test('shared navigation deterministically maps representative routes to one current section per primary nav surface', () => {
  for (const [path, expectedKey] of routeMatrix) {
    const html = renderPrimaryNavigation(path);
    const desktop = extractNav(html, 'fd-nav fd-nav--desktop');
    const mobileMenu = extractNav(html, 'fd-nav fd-nav--mobile');

    assert.deepEqual(currentKeys(desktop), [expectedKey], `${path} desktop current section`);
    assert.deepEqual(currentKeys(mobileMenu), [expectedKey], `${path} menu current section`);
  }
});

test('mobile quick dock stays six destinations and only marks a current item for dock-owned sections', () => {
  const dockKeys = ['teams', 'schedule', 'score', 'availability', 'messages', 'profile'];

  for (const [path, expectedKey] of routeMatrix) {
    const html = renderPrimaryNavigation(path);
    const dock = extractNav(html, 'fd-mobile-dock');

    if (expectedKey === 'score') {
      assert.equal(dock, '', `${path} intentionally uses score focus mode without the dock`);
      continue;
    }

    const renderedKeys = [...dock.matchAll(/data-nav-key="([^"]+)"/g)].map((match) => match[1]);
    assert.deepEqual(renderedKeys, dockKeys, `${path} dock destinations`);

    const expectedCurrent = dockKeys.includes(expectedKey) ? [expectedKey] : [];
    assert.deepEqual(currentKeys(dock), expectedCurrent, `${path} dock current section`);
  }
});

test('diagnostic exceptions do not invent a current product-navigation section', () => {
  for (const path of ['/health', '/health/environment']) {
    const html = renderPrimaryNavigation(path);
    const desktop = extractNav(html, 'fd-nav fd-nav--desktop');
    const mobileMenu = extractNav(html, 'fd-nav fd-nav--mobile');
    const dock = extractNav(html, 'fd-mobile-dock');

    assert.deepEqual(currentKeys(desktop), [], `${path} desktop`);
    assert.deepEqual(currentKeys(mobileMenu), [], `${path} menu`);
    assert.deepEqual(currentKeys(dock), [], `${path} dock`);
  }
});
