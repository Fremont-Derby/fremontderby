import { normalizeStatusTone } from './statusTone.js';

/** Status strip helper. No-ops when the element is missing. */
export function createStatusController(el) {
  if (!el) {
    return {
      set() {},
      clear() {},
      element: null,
    };
  }
  return {
    element: el,
    set(message, tone = 'muted') {
      const text = message == null ? '' : String(message);
      el.textContent = text;
      if (!text) {
        el.removeAttribute('data-tone');
        return;
      }
      el.dataset.tone = normalizeStatusTone(tone);
    },
    clear() {
      el.textContent = '';
      el.removeAttribute('data-tone');
    },
  };
}
