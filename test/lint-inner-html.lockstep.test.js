import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isDynamicInnerHtmlLine,
  shouldSkipFile,
  collectInnerHtmlOffenders,
  lintInnerHtmlTree,
} from '../scripts/lint-inner-html.mjs';

test('isDynamicInnerHtmlLine allows static string assignments', () => {
  assert.equal(isDynamicInnerHtmlLine("el.innerHTML = '<table></table>';"), false);
  assert.equal(isDynamicInnerHtmlLine('el.innerHTML = `<div class="x"></div>`;'), false);
  assert.equal(isDynamicInnerHtmlLine('const x = 1;'), false);
});

test('isDynamicInnerHtmlLine flags template interpolation and non-literal RHS', () => {
  assert.equal(isDynamicInnerHtmlLine('el.innerHTML = `<div>${name}</div>`;'), true);
  assert.equal(isDynamicInnerHtmlLine('el.innerHTML = html;'), true);
  assert.equal(isDynamicInnerHtmlLine("el.innerHTML = '<b>' + name + '</b>';"), true);
});

test('sandbox paths are skipped', () => {
  assert.equal(shouldSkipFile('src/SandboxDemo.js'), true);
  assert.equal(shouldSkipFile('src/pages/sandbox-tools.js'), true);
  assert.equal(shouldSkipFile('src/routerEntry.js'), false);
});

test('collectInnerHtmlOffenders reports file:line prefixes', () => {
  const lines = [
    "ok.innerHTML = '<p></p>';",
    'bad.innerHTML = `${x}`;',
  ];
  const offenders = collectInnerHtmlOffenders(lines, 'src/x.js');
  assert.equal(offenders.length, 1);
  assert.match(offenders[0], /^src\/x\.js:2:/);
});

test('lintInnerHtmlTree walks js files and skips sandbox + non-js', () => {
  const tree = {
    src: [
      { name: 'ok.js', isDirectory: () => false },
      { name: 'bad.js', isDirectory: () => false },
      { name: 'Sandbox.js', isDirectory: () => false },
      { name: 'note.md', isDirectory: () => false },
      { name: 'node_modules', isDirectory: () => true },
    ],
    'src/node_modules': [{ name: 'evil.js', isDirectory: () => false }],
  };
  const files = {
    'src/ok.js': "el.innerHTML = '<span></span>';\n",
    'src/bad.js': 'el.innerHTML = userHtml;\n',
    'src/Sandbox.js': 'el.innerHTML = `${demo}`;\n',
    'src/node_modules/evil.js': 'el.innerHTML = `${x}`;\n',
  };

  const offenders = lintInnerHtmlTree('src', {
    readdirSync: (dir) => tree[dir] || [],
    readFileSync: (p) => files[p],
  });

  assert.equal(offenders.length, 1);
  assert.match(offenders[0], /src[\\/]bad\.js:1:/);
});
