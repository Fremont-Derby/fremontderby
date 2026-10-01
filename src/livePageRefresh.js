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
 *   fdFriendlyError(err) → product-safe client error string
 *   fdQuietRun(action, { quiet, statusEl, loadingMessage }) → shared try/catch runner
 *   register(fn, { statusEl, softFail }) → soft will-retry after quiet failures
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
      if (quiet && entry.statusEl && entry.statusEl.dataset && entry.statusEl.dataset.fdSoftFail === '1') {
        window.fdSetStatus(entry.statusEl, entry.lastOkStatus || 'Up to date', 'ok');
        delete entry.statusEl.dataset.fdSoftFail;
      }
    } catch (error) {
      entry.failCount = (entry.failCount || 0) + 1;
      entry.nextAllowedAt = Date.now() + Math.min(60000, 5000 * entry.failCount);
      entry.lastError = error;
      window.fdLiveRefresh.lastError = error;
      if (quiet && entry.softFail !== false && entry.statusEl && entry.failCount >= 2) {
        const friendly = window.fdFriendlyError(error);
        const soft = entry.failCount >= 3
          ? ('Last update failed — will retry. ' + friendly)
          : 'Update delayed — retrying…';
        window.fdSetStatus(entry.statusEl, soft, 'muted');
        entry.statusEl.dataset.fdSoftFail = '1';
      }
      if (typeof entry.onFail === 'function') {
        try { entry.onFail(error, { quiet, reason, failCount: entry.failCount }); } catch (_) {}
      }
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
    const textMsg = String(message == null ? '' : message);
    if (quiet && /^(loading|checking|saving|working)\b/i.test(textMsg.trim())) return;
    el.textContent = textMsg;
    if (tone) el.dataset.tone = String(tone);
    else if (el.dataset) delete el.dataset.tone;
  };

  // Product-safe client errors (mirrors friendlyErrorMessage.js).
  window.fdFriendlyError = function fdFriendlyError(error) {
    if (typeof window.friendlyErrorMessage === 'function') {
      try { return window.friendlyErrorMessage(error); } catch (_) {}
    }
    const raw = error && typeof error === 'object' && error.message
      ? String(error.message)
      : String(error || '');
    const message = raw.replace(/\s+/g, ' ').trim();
    if (!message) return 'We could not complete that action. Please try again.';
    if (
      (typeof navigator !== 'undefined' && navigator.onLine === false)
      || /failed to fetch|networkerror|net::err_|load failed|offline/i.test(message)
    ) {
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        return 'You appear to be offline. Reconnect and try again. Nothing was changed.';
      }
      return 'We could not reach the league service. Check your connection and try again. Nothing was changed.';
    }
    if (/sign[- ]?in expired|session expired|unauthorized|jwt/i.test(message)) {
      return 'Your sign-in expired. Open Profile, sign in again, and retry.';
    }
    if (/503|service unavailable|worker threw/i.test(message)) {
      return 'The league service is temporarily unavailable. Please try again in a moment. Nothing was changed.';
    }
    if (/429|rate limit|too many requests|throttl/i.test(message)) {
      return 'Too many requests in a short time. Wait a few seconds and try again.';
    }
    if (/migration|schema cache|PGRST202|function .+ does not exist|could not find the function/i.test(message)) {
      return 'This league feature is still being published. Please try again shortly. Nothing was changed.';
    }
    if (/supabase|postgrest|permission denied|postgres|PGRST|statement timeout|service role/i.test(message)) {
      return 'We could not complete that action. Nothing was changed. Please try again.';
    }
    return message;
  };

  /**
   * Shared page action runner.
   *   await window.fdQuietRun(async () => {...}, { quiet, statusEl, loadingMessage })
   */
  window.fdQuietRun = async function fdQuietRun(action, options) {
    const opts = options || {};
    const quiet = Boolean(opts.quiet);
    const statusEl = opts.statusEl || null;
    try {
      if (!quiet && statusEl && opts.loadingMessage) {
        window.fdSetStatus(statusEl, opts.loadingMessage, 'muted');
      }
      return await action({ quiet, reason: opts.reason, isBackground: quiet });
    } catch (error) {
      const friendly = window.fdFriendlyError(error);
      if (statusEl && (!quiet || opts.surfaceQuietErrors)) {
        window.fdSetStatus(statusEl, friendly, 'error');
      }
      if (typeof opts.onError === 'function') {
        try { opts.onError(error, friendly, { quiet }); } catch (_) {}
      }
      if (opts.rethrow !== false) throw error;
      return null;
    }
  };

  window.fdLiveRefresh = {
    lastError: null,
    register(fn, options) {
      options = options || {};
      if (typeof fn !== 'function') return function () {};
      const id = 'lr-' + String(++seq);
      const statusEl = options.statusEl
        || (typeof document !== 'undefined' ? document.querySelector('[data-status]') : null)
        || null;
      const entry = {
        id: id,
        fn: fn,
        intervalMs: options.intervalMs,
        statusEl: statusEl,
        softFail: options.softFail !== false,
        onFail: typeof options.onFail === 'function' ? options.onFail : null,
        lastOkStatus: options.lastOkStatus || '',
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
      return function () {
        const current = registry.get(id);
        if (!current) return;
        clearTimer(current);
        registry.delete(id);
      };
    },
    refreshNow(reason) {
      runAll(reason || 'manual');
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
