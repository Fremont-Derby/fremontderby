/**
 * Browser live-refresh registry for ship-quality in-place updates.
 *
 * Pages:
 *   window.fdLiveRefresh.register((opts) => reload(opts), { intervalMs: 20000 })
 * Loader contract:
 *   opts.quiet === true → no loading flash / no destructive empty states
 *
 * Behavior:
 * - Polls only while the tab is visible
 * - Refreshes on focus, pageshow, visibility, and back-online
 * - Debounces bursty focus+visibility pairs
 * - Skips overlapping runs
 * - Backs off briefly after repeated failures
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
    if (entry.failCount >= 3 && entry.nextAllowedAt && Date.now() < entry.nextAllowedAt) return;

    entry.running = true;
    entry.lastReason = reason;
    try {
      await entry.fn({ quiet: reason !== 'manual', reason });
      entry.failCount = 0;
      entry.nextAllowedAt = 0;
      entry.lastAt = Date.now();
    } catch {
      entry.failCount = (entry.failCount || 0) + 1;
      entry.nextAllowedAt = Date.now() + Math.min(60000, 5000 * entry.failCount);
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
    if (etag) {
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

  window.fdLiveRefresh = {
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
