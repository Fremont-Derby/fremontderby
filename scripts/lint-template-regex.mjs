/**
 * Guard the known footgun: unescaped \s inside template literals becomes /s+/ at runtime.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export const ERROR_POPUP_SCRIPT_MARKER = 'const errorPopupScript';

/**
 * Source inside the template must contain \\\\s so the browser receives \\s
 * (a whitespace class), not an unescaped /s+/ flag fragment.
 */
export const ESCAPED_WHITESPACE_CLASS_RE = /replace\(\/\\\\s\+\//;

/**
 * Pure validation of appShell source for the errorPopupScript regex escape.
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
export function validateErrorPopupScriptEscape(appShellSource) {
  const text = String(appShellSource || '');
  const start = text.indexOf(ERROR_POPUP_SCRIPT_MARKER);
  if (start < 0) {
    return { ok: false, error: 'lint-template-regex: errorPopupScript not found' };
  }
  const chunk = text.slice(start, start + 5000);
  if (!ESCAPED_WHITESPACE_CLASS_RE.test(chunk)) {
    return {
      ok: false,
      error:
        'lint-template-regex: errorPopupScript must use \\\\s in source so the browser gets \\s',
    };
  }
  return { ok: true };
}

export function lintTemplateRegexFromFile(
  fileUrl = new URL('../src/appShell.js', import.meta.url),
  { readFileSync: readFile = readFileSync } = {},
) {
  const appShell = readFile(fileUrl, 'utf8');
  return validateErrorPopupScriptEscape(appShell);
}

const isDirect =
  process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isDirect) {
  const result = lintTemplateRegexFromFile();
  if (!result.ok) {
    console.error(result.error);
    process.exit(1);
  }
  console.log('lint-template-regex: ok');
}
