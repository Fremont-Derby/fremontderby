/**
 * Guard the known footgun: unescaped \s inside template literals becomes /s+/ at runtime.
 */
import { readFileSync } from 'node:fs';

const appShell = readFileSync(new URL('../src/appShell.js', import.meta.url), 'utf8');
const start = appShell.indexOf('const errorPopupScript');
if (start < 0) {
  console.error('lint-template-regex: errorPopupScript not found');
  process.exit(1);
}
const chunk = appShell.slice(start, start + 5000);
// Emitted browser script must contain \s (source must contain \\s inside the template)
if (!/replace\(\/\\\\s\+\//.test(chunk)) {
  console.error(
    'lint-template-regex: errorPopupScript must use \\\\s in source so the browser gets \\s',
  );
  process.exit(1);
}
console.log('lint-template-regex: ok');
