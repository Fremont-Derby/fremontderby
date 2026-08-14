/**
 * Browser live-refresh registry for ship-quality in-place updates.
 *
 * Pages:
 *   window.fdLiveRefresh.register((opts) => reload(opts), { intervalMs: 20000 })
 *
 * Loader contract (required for ship-quality):
 *   opts.quiet === true  → no "Loading…" status flash, no destructive empty states,
 *                           no full-list wipe when data is unchanged (prefer fdStableList)
 *   opts.reason          → 'interval' | 'focus' | 'visible' | 'pageshow' | 'online' | 'register' | 'manual'
 *   opts.isBackground    → true for any non-manual reason (same as quiet for most pages)
 *
 * Helpers exposed on window:
 *   fdStableList(container, items, { key, signature, render })
 *   fdSetStatus(el, message, tone, { quiet })  → skips Loading-like messages when quiet
 *   fdFriendlyError(err) → product-safe client error string when available
 *
 * Behavior:
 * - Polls only while the tab is visible and navigator.onLine
 * - Refreshes on focus, pageshow, visibility, and back-online
 * - Debounces bursty focus+visibility pairs
 * - Skips overlapping runs
 * - Backs off briefly after repeated failures (lastError kept for diagnostics)
 */
export const livePageRefreshScript = `<script data-fd-live-refresh-script>
(() => {
  if (window.fdLiveRefresh) return;

  const DEFAULT_INTERVAL_MS = 20000;
  const MIN_INTERVAL_MS = 8000;
  const DEBOUNCE_MS = 400;
  const registry = new Map();
  let seq = 0;
  let globalDebounce = null;

  function isVisible() {
    return document.visibilityState === 'visible';
  }

  async function runOne(entry, reason) {
    if (!entry || entry.running) return;
    if (!isVisible() && reason === 'interval') return;
    // Offline interval polls waste battery and produce noisy failed-to-fetch errors.
    if (reason === 'interval' && typeof navigator !== 'undefined' && navigator.onLine === false) return;
    if (entry.failCount >= 3 && entry.nextAllowedAt && Date.now() < entry.nextAllowedAt) return;

    entry.running = true;
    entry.lastReason = reason;
    const quiet = reason !== 'manual';
    try {
      await entry.fn({ quiet, reason, isBackground: quiet });
      entry.failCount = 0;
      entry.nextAllowedAt = 0;
      entry.lastError = null;
      entry.lastAt = Date.now();
      window.fdLiveRefresh.lastError = null;
    } catch (error) {
      entry.failCount = (entry.failCount || 0) + 1;
      entry.nextAllowedAt = Date.now() + Math.min(60000, 5000 * entry.failCount);
      entry.lastError = error;
      window.fdLiveRefresh.lastError = error;
      // Background failures stay silent at the registry layer; pages may still surface via their own catch.
    } finally {
      entry.running = false;
    }
  }

  function runAll(reason) {
    registry.forEach((entry) => {
      runOne(entry, reason);
    });
  }

  function runAllDebounced(reason) {
    if (globalDebounce) clearTimeout(globalDebounce);
    globalDebounce = setTimeout(() => {
      globalDebounce = null;
      runAll(reason);
    }, DEBOUNCE_MS);
  }

  function clearTimer(entry) {
    if (entry.timer) {
      clearInterval(entry.timer);
      entry.timer = null;
    }
  }

  function arm(entry) {
    clearTimer(entry);
    const ms = Math.max(MIN_INTERVAL_MS, Number(entry.intervalMs) || DEFAULT_INTERVAL_MS);
    entry.timer = setInterval(() => runOne(entry, 'interval'), ms);
  }


  // WHY: session body cache makes repeat visits feel instant while ETags keep backend cheap.
  function isSensitiveUrl(url) {
    // WHY: never persist contact/PII JSON in sessionStorage.
    // Use string checks only — regex with \/ inside this template becomes // comments.
    const path = String(url || '');
    return path.includes('/api/me/contact')
      || (path.includes('/api/admin/players/') && path.includes('/contact'))
      || path.includes('reveal=');
  }
  function etagKey(url) {
    return 'fd.etag:' + String(url);
  }
  function bodyKey(url) {
    return 'fd.body:' + String(url);
  }

  function readCache(url) {
    try {
      const raw = sessionStorage.getItem(bodyKey(url));
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function writeCache(url, body) {
    if (isSensitiveUrl(url)) return;
    try {
      sessionStorage.setItem(bodyKey(url), JSON.stringify(body));
    } catch {}
  }

  window.fdReadCachedJson = function fdReadCachedJson(url) {
    return readCache(url);
  };

  window.fdConditionalFetch = async function fdConditionalFetch(url, options = {}) {
    const headers = new Headers(options.headers || {});
    const key = etagKey(url);
    try {
      const prior = sessionStorage.getItem(key);
      if (prior && !headers.has('if-none-match')) headers.set('if-none-match', prior);
    } catch {}
    const response = await fetch(url, { ...options, headers });
    const etag = response.headers.get('etag');
    if (etag && !isSensitiveUrl(url)) {
      try { sessionStorage.setItem(key, etag); } catch {}
    }
    if (response.status === 304) {
      const cached = readCache(url);
      return { response, notModified: true, body: cached, fromCache: Boolean(cached) };
    }
    let body = null;
    const text = await response.text();
    if (text) {
      try { body = JSON.parse(text); } catch { body = text; }
    }
    if (response.ok && body && typeof body === 'object') {
      writeCache(url, body);
    }
    return { response, notModified: false, body, fromCache: false };
  };


  // Stable list renderer: only mutates rows whose signature changed.
  // container: element holding row children
  // rows: array of data
  // opts.key(row) -> stable id string
  // opts.signature(row) -> string compared across polls
  // opts.render(row, el?) -> HTMLElement (create or update)
  window.fdStableList = function fdStableList(container, rows, opts) {
    if (!container || !opts || typeof opts.key !== 'function' || typeof opts.render !== 'function') return;
    const keyFn = opts.key;
    const sigFn = typeof opts.signature === 'function' ? opts.signature : keyFn;
    const existing = new Map();
    for (const child of Array.from(container.children)) {
      const k = child.dataset && child.dataset.stableKey;
      if (k) existing.set(k, child);
    }
    const nextKeys = new Set();
    const frag = document.createDocumentFragment();
    let orderChanged = false;
    let prev = null;
    for (const row of rows || []) {
      const k = String(keyFn(row) || '');
      if (!k) continue;
      nextKeys.add(k);
      const sig = String(sigFn(row) || '');
      let el = existing.get(k);
      if (el && el.dataset.stableSig === sig) {
        // unchanged — keep node
      } else if (el) {
        const updated = opts.render(row, el);
        el = updated || el;
        el.dataset.stableKey = k;
        el.dataset.stableSig = sig;
      } else {
        el = opts.render(row, null);
        if (!el) continue;
        el.dataset.stableKey = k;
        el.dataset.stableSig = sig;
      }
      frag.appendChild(el);
    }
    // Remove stale
    for (const [k, el] of existing) {
      if (!nextKeys.has(k) && el.parentNode === container) el.remove();
    }
    // If order/content of remaining matches, avoid full replace when possible
    container.replaceChildren(frag);
  };

  // Quiet-aware status helper: avoids "Loading…" flicker on background polls.
  window.fdSetStatus = function fdSetStatus(el, message, tone, opts) {
    if (!el) return;
    const quiet = Boolean(opts && opts.quiet);
    const text = String(message == null ? '' : message);
    if (quiet && /^(loading|checking|saving|working)\b/i.test(text.trim())) return;
    el.textContent = text;
    if (tone) el.dataset.tone = tone;
    else if (el.dataset) delete el.dataset.tone;
  };

  // Prefer product-safe mapping when friendlyErrorMessage was inlined by the page.
  window.fdFriendlyError = function fdFriendlyError(error) {
    if (typeof window.friendlyErrorMessage === 'function') {
      try { return window.friendlyErrorMessage(error); } catch (_) {}
    }
    if (error && typeof error === 'object' && error.message) return String(error.message);
    return String(error || 'We could not complete that action. Please try again.');
  };

  window.fdLiveRefresh = {
    lastError: null,
    register(fn, options = {}) {
      if (typeof fn !== 'function') return () => {};
      const id = 'lr-' + String(++seq);
      const entry = {
        id,
        fn,
        intervalMs: options.intervalMs,
        running: false,
        timer: null,
        lastAt: 0,
        lastReason: '',
        lastError: null,
        failCount: 0,
        nextAllowedAt: 0,
      };
      registry.set(id, entry);
      arm(entry);
      if (options.immediate === true && isVisible()) {
        runOne(entry, 'register');
      }
      return () => {
        const current = registry.get(id);
        if (!current) return;
        clearTimer(current);
        registry.delete(id);
      };
    },
    refreshNow(reason = 'manual') {
      runAll(reason);
    },
  };

  document.addEventListener('visibilitychange', () => {
    if (isVisible()) runAllDebounced('visible');
  });
  window.addEventListener('focus', () => runAllDebounced('focus'));
  window.addEventListener('pageshow', () => runAllDebounced('pageshow'));
  window.addEventListener('online', () => runAllDebounced('online'));
})();
</script>`;
