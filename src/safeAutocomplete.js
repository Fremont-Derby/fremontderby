/**
 * League text-field autocomplete.
 *
 * Player names come from public individual standings (same data as /standings).
 * Still require 2+ characters and cap results so the UI stays usable.
 */

export const SAFE_AC_MIN_CHARS = 2;
export const SAFE_AC_MAX_RESULTS = 12;

export const PRACTICE_LOCATION_SUGGESTIONS = [
  'Fremont Bowl',
  'Fremont Bowl — side tables',
  'Home club tables',
  'Mutual venue (TBD)',
];

export const PRACTICE_TIME_SUGGESTIONS = [
  'Weeknights 7:00 PM',
  'Thursdays 6:30–8:00 PM',
  'Sundays 2:00–4:00 PM',
  'Before league night',
  'After league night',
];

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

  let publicPlayerNamesPromise = null;
  let publicPlayerNames = null;

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

  async function loadPublicPlayerNames() {
    if (publicPlayerNames) return publicPlayerNames;
    if (publicPlayerNamesPromise) return publicPlayerNamesPromise;
    publicPlayerNamesPromise = (async () => {
      try {
        const seasonsRes = await fetch('/api/seasons');
        const seasonsBody = await seasonsRes.json().catch(() => ({}));
        const seasons = Array.isArray(seasonsBody.seasons) ? seasonsBody.seasons : [];
        // Prefer active/playoffs/complete seasons; fall back to all.
        const preferred = seasons.filter((s) =>
          ['active', 'playoffs', 'complete', 'registration'].includes(String(s.status || ''))
        );
        const list = preferred.length ? preferred : seasons;
        const names = new Set();
        await Promise.all(
          list.slice(0, 6).map(async (season) => {
            const id = season.id || season.seasonId;
            if (!id) return;
            try {
              const res = await fetch('/api/seasons/' + encodeURIComponent(id) + '/individual-standings');
              const body = await res.json().catch(() => ({}));
              const rows = body.standings || body.players || [];
              for (const row of rows) {
                const name = row.display_name || row.displayName || row.player_name;
                if (name) names.add(String(name).trim());
              }
            } catch {
              // ignore season failures
            }
          }),
        );
        publicPlayerNames = [...names].sort((a, b) => a.localeCompare(b));
        return publicPlayerNames;
      } catch {
        publicPlayerNames = [];
        return publicPlayerNames;
      }
    })();
    return publicPlayerNamesPromise;
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

  async function candidatesFor(input) {
    const key = input.getAttribute('data-safe-ac');
    if (key === 'publicPlayers' || key === 'players') {
      return loadPublicPlayerNames();
    }
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

  async function refresh(input) {
    const list = ensureList(input);
    const candidates = await candidatesFor(input);
    const matches = filter(input.value, candidates);
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
    if (!input.getAttribute('autocomplete')) input.setAttribute('autocomplete', 'off');
    let timer = null;
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(() => refresh(input), 120);
    };
    input.addEventListener('input', schedule);
    input.addEventListener('focus', schedule);
  }

  function scan(root) {
    const scope = root || document;
    scope.querySelectorAll('[data-safe-ac], [data-safe-ac-candidates]').forEach(bind);
  }

  window.fdSafeAutocomplete = {
    scan,
    filter,
    bind,
    loadPublicPlayerNames,
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
