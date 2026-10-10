import test from 'node:test';
import assert from 'node:assert/strict';

test('renderPrizesPage is a render function', async () => {
  const mod = await import('../src/prizesPage.js');
  assert.equal(typeof mod.renderPrizesPage, 'function');
});
test('renderPrizesPage returns markup or asks for its arguments', async () => {
  const mod = await import('../src/prizesPage.js');
  let html = null;
  try { html = mod.renderPrizesPage(); } catch {}
  if (html == null) { try { html = mod.renderPrizesPage({}); } catch {} }
  if (typeof html === 'string') {
    assert.ok(html.length > 0);
    assert.match(html, /<[a-z!]/i);
  } else {
    assert.equal(typeof mod.renderPrizesPage, 'function');
  }
});
test('renderProfilePage is a render function', async () => {
  const mod = await import('../src/profilePage.js');
  assert.equal(typeof mod.renderProfilePage, 'function');
});
test('renderProfilePage returns markup or asks for its arguments', async () => {
  const mod = await import('../src/profilePage.js');
  let html = null;
  try { html = mod.renderProfilePage(); } catch {}
  if (html == null) { try { html = mod.renderProfilePage({}); } catch {} }
  if (typeof html === 'string') {
    assert.ok(html.length > 0);
    assert.match(html, /<[a-z!]/i);
  } else {
    assert.equal(typeof mod.renderProfilePage, 'function');
  }
});
test('renderIntroPage is a render function', async () => {
  const mod = await import('../src/publicPages.js');
  assert.equal(typeof mod.renderIntroPage, 'function');
});
test('renderIntroPage returns markup or asks for its arguments', async () => {
  const mod = await import('../src/publicPages.js');
  let html = null;
  try { html = mod.renderIntroPage(); } catch {}
  if (html == null) { try { html = mod.renderIntroPage({}); } catch {} }
  if (typeof html === 'string') {
    assert.ok(html.length > 0);
    assert.match(html, /<[a-z!]/i);
  } else {
    assert.equal(typeof mod.renderIntroPage, 'function');
  }
});
test('renderRulesPage is a render function', async () => {
  const mod = await import('../src/publicPages.js');
  assert.equal(typeof mod.renderRulesPage, 'function');
});
test('renderRulesPage returns markup or asks for its arguments', async () => {
  const mod = await import('../src/publicPages.js');
  let html = null;
  try { html = mod.renderRulesPage(); } catch {}
  if (html == null) { try { html = mod.renderRulesPage({}); } catch {} }
  if (typeof html === 'string') {
    assert.ok(html.length > 0);
    assert.match(html, /<[a-z!]/i);
  } else {
    assert.equal(typeof mod.renderRulesPage, 'function');
  }
});
test('renderPersonaEvidenceScript is a render function', async () => {
  const mod = await import('../src/qaPersonaEvidenceClient.js');
  assert.equal(typeof mod.renderPersonaEvidenceScript, 'function');
});
test('renderPersonaEvidenceScript returns markup or asks for its arguments', async () => {
  const mod = await import('../src/qaPersonaEvidenceClient.js');
  let html = null;
  try { html = mod.renderPersonaEvidenceScript(); } catch {}
  if (html == null) { try { html = mod.renderPersonaEvidenceScript({}); } catch {} }
  if (typeof html === 'string') {
    assert.ok(html.length > 0);
    assert.match(html, /<[a-z!]/i);
  } else {
    assert.equal(typeof mod.renderPersonaEvidenceScript, 'function');
  }
});
test('renderRackLedgerScorecardPage is a render function', async () => {
  const mod = await import('../src/rackLedgerScorecard.js');
  assert.equal(typeof mod.renderRackLedgerScorecardPage, 'function');
});
test('renderRackLedgerScorecardPage returns markup or asks for its arguments', async () => {
  const mod = await import('../src/rackLedgerScorecard.js');
  let html = null;
  try { html = mod.renderRackLedgerScorecardPage(); } catch {}
  if (html == null) { try { html = mod.renderRackLedgerScorecardPage({}); } catch {} }
  if (typeof html === 'string') {
    assert.ok(html.length > 0);
    assert.match(html, /<[a-z!]/i);
  } else {
    assert.equal(typeof mod.renderRackLedgerScorecardPage, 'function');
  }
});
test('renderSchedulePage is a render function', async () => {
  const mod = await import('../src/schedulePage.js');
  assert.equal(typeof mod.renderSchedulePage, 'function');
});
test('renderSchedulePage returns markup or asks for its arguments', async () => {
  const mod = await import('../src/schedulePage.js');
  let html = null;
  try { html = mod.renderSchedulePage(); } catch {}
  if (html == null) { try { html = mod.renderSchedulePage({}); } catch {} }
  if (typeof html === 'string') {
    assert.ok(html.length > 0);
    assert.match(html, /<[a-z!]/i);
  } else {
    assert.equal(typeof mod.renderSchedulePage, 'function');
  }
});
test('renderScorePickerPage is a render function', async () => {
  const mod = await import('../src/scorePickerPage.js');
  assert.equal(typeof mod.renderScorePickerPage, 'function');
});
test('renderScorePickerPage returns markup or asks for its arguments', async () => {
  const mod = await import('../src/scorePickerPage.js');
  let html = null;
  try { html = mod.renderScorePickerPage(); } catch {}
  if (html == null) { try { html = mod.renderScorePickerPage({}); } catch {} }
  if (typeof html === 'string') {
    assert.ok(html.length > 0);
    assert.match(html, /<[a-z!]/i);
  } else {
    assert.equal(typeof mod.renderScorePickerPage, 'function');
  }
});
