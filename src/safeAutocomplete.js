/**
 * Privacy-aware autocomplete helpers for league UIs.
 *
 * Rules:
 * - Never suggest from a global player dump on 1 character.
 * - Require minChars (default 2) before filtering candidates.
 * - Cap results (default 8).
 * - Candidates must already be authorized for the viewer (roster, admin load, etc.).
 * - Static venue/time suggestions are non-PII and safe to always offer after minChars.
 */

export const SAFE_AC_MIN_CHARS = 2;
export const SAFE_AC_MAX_RESULTS = 8;

/** Non-PII practice location hints (league venue style, not a player directory). */
export const PRACTICE_LOCATION_SUGGESTIONS = [
  'Fremont Bowl',
  'Fremont Bowl — side tables',
  'Home club tables',
  'Mutual venue (TBD)',
];

/** Non-PII practice time/cadence hints. */
export const PRACTICE_TIME_SUGGESTIONS = [
  'Weeknights 7:00 PM',
  'Thursdays 6:30–8:00 PM',
  'Sundays 2:00–4:00 PM',
  'Before league night',
  'After league night',
];

/** Non-PII makeup location hints. */
export const MAKEUP_LOCATION_SUGGESTIONS = [
  'Fremont Bowl',
  'Same tables as scheduled',
  'Mutual venue',
];

export function filterSafeSuggestions(query, candidates, {
  minChars = SAFE_AC_MIN_CHARS,
  maxResults = SAFE_AC_MAX_RESULTS,
} = {}) {
  const q = String(query || '').trim().toLowerCase();
  if (q.length < minChars) return [];
  const list = Array.isArray(candidates) ? candidates : [];
  const out = [];
  const seen = new Set();
  for (const raw of list) {
    const text = String(raw || '').trim();
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    if (!key.includes(q)) continue;
    seen.add(key);
    out.push(text);
    if (out.length >= maxResults) break;
  }
  return out;
}

/**
 * Browser-side helper source injected into pages.
 * Attaches datalists to elements with data-safe-ac="static-key" or data-safe-ac-candidates JSON.
 */
export const safeAutocompleteClientScript = `
<script data-safe-autocomplete>
(() => {
  const MIN = ${SAFE_AC_MIN_CHARS};
  const MAX = ${SAFE_AC_MAX_RESULTS};
  const STATIC = {
    practiceLocation: ${JSON.stringify(PRACTICE_LOCATION_SUGGESTIONS)},
    practiceTime: ${JSON.stringify(PRACTICE_TIME_SUGGESTIONS)},
    makeupLocation: ${JSON.stringify(MAKEUP_LOCATION_SUGGESTIONS)},
  };

  function filter(query, candidates) {
    const q = String(query || '').trim().toLowerCase();
    if (q.length < MIN) return [];
    const out = [];
    const seen = new Set();
    for (const raw of candidates || []) {
      const text = String(raw || '').trim();
      if (!text) continue;
      const key = text.toLowerCase();
      if (seen.has(key) || !key.includes(q)) continue;
      seen.add(key);
      out.push(text);
      if (out.length >= MAX) break;
    }
    return out;
  }

  function ensureList(input) {
    let id = input.getAttribute('list');
    if (!id) {
      id = 'safe-ac-' + Math.random().toString(36).slice(2, 10);
      input.setAttribute('list', id);
    }
    let list = document.getElementById(id);
    if (!list) {
      list = document.createElement('datalist');
      list.id = id;
      input.insertAdjacentElement('afterend', list);
    }
    return list;
  }

  function candidatesFor(input) {
    const key = input.getAttribute('data-safe-ac');
    if (key && STATIC[key]) return STATIC[key].slice();
    const raw = input.getAttribute('data-safe-ac-candidates');
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }

  function refresh(input) {
    const list = ensureList(input);
    const matches = filter(input.value, candidatesFor(input));
    list.replaceChildren();
    for (const text of matches) {
      const option = document.createElement('option');
      option.value = text;
      list.append(option);
    }
  }

  function bind(input) {
    if (!input || input.dataset.safeAcBound === '1') return;
    input.dataset.safeAcBound = '1';
    input.setAttribute('autocomplete', input.getAttribute('autocomplete') || 'off');
    input.addEventListener('input', () => refresh(input));
    input.addEventListener('focus', () => refresh(input));
  }

  function scan(root) {
    const scope = root || document;
    scope.querySelectorAll('[data-safe-ac], [data-safe-ac-candidates]').forEach(bind);
  }

  window.fdSafeAutocomplete = {
    scan,
    filter,
    bind,
    minChars: MIN,
    maxResults: MAX,
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => scan(document));
  } else {
    scan(document);
  }
})();
</script>
`;
