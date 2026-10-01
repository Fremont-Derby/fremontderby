import assert from 'node:assert/strict';
import test from 'node:test';
import { renderAdminOperationsPage } from '../src/adminOperationsPage.js';
import { renderAvailabilityPage } from '../src/availabilityPage.js';
import { renderCaptainSandboxPage } from '../src/captainSandboxPage.js';
import { renderChatModerationPage } from '../src/chatModerationPage.js';
import { renderScorePickerPage } from '../src/scorePickerPage.js';
import { renderSeasonSetupPage } from '../src/seasonSetupPage.js';
import { renderDemoSeasonPage } from '../src/demoSeasonPage.js';

const pages = [
  ['admin operations', renderAdminOperationsPage],
  ['availability', renderAvailabilityPage],
  ['captain sandbox', renderCaptainSandboxPage],
  ['chat moderation', renderChatModerationPage],
  ['score picker', renderScorePickerPage],
  ['season setup', renderSeasonSetupPage],
  ['demo season', renderDemoSeasonPage],
];

for (const [label, render] of pages) {
  test(`${label} page has manipulation touch-action and 16px form fields`, () => {
    const html = typeof render === 'function' ? render() : render;
    const text = typeof html === 'string' ? html : String(html);
    assert.match(text, /touch-action:\s*manipulation/);
    assert.match(text, /font-size:\s*16px/);
  });
}
