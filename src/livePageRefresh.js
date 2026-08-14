/**
 * Browser live-refresh registry.
 * Pages call: window.fdLiveRefresh.register(() => reloadData(), { intervalMs: 20000 })
 * - Polls while the tab is visible
 * - Refreshes on focus / pageshow / visibilitychange
 * - Skips overlapping runs
 */
export const livePageRefreshScript = `<script data-fd-live-refresh-script>
(() => {
  if (window.fdLiveRefresh) return;

  const DEFAULT_INTERVAL_MS = 20000;
  const MIN_INTERVAL_MS = 5000;
  const registry = new Map();
  let seq = 0;

  function isVisible() {
    return document.visibilityState === 'visible';
  }

  async function runOne(entry, reason) {
    if (!entry || entry.running) return;
    if (!isVisible() && reason === 'interval') return;
    entry.running = true;
    entry.lastReason = reason;
    try {
      await entry.fn({ quiet: true, reason });
    } catch {
      // Page loaders own user-visible errors; keep polling resilient.
    } finally {
      entry.running = false;
      entry.lastAt = Date.now();
    }
  }

  function runAll(reason) {
    registry.forEach((entry) => {
      runOne(entry, reason);
    });
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
      };
      registry.set(id, entry);
      arm(entry);
      if (options.immediate !== false && isVisible()) {
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
    if (isVisible()) runAll('visible');
  });
  window.addEventListener('focus', () => runAll('focus'));
  window.addEventListener('pageshow', () => runAll('pageshow'));
})();
</script>`;
