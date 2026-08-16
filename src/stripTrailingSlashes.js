/**
 * Strip trailing '/' without a quantifier regex (avoids CodeQL js/polynomial-redos).
 * @param {string} value
 * @returns {string}
 */
export function stripTrailingSlashes(value) {
  let s = String(value ?? '');
  while (s.endsWith('/')) {
    s = s.slice(0, -1);
  }
  return s;
}
