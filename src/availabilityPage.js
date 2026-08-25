import { renderAvailabilityPage as renderAvailabilityPageCore } from './availabilityPageCore.js';

const trippyCheckinTheme = `<style data-checkin-trippy-theme>
  body {
    background:
      radial-gradient(circle at 12% 10%, rgba(255, 0, 214, .30), transparent 28%),
      radial-gradient(circle at 88% 18%, rgba(0, 238, 255, .28), transparent 30%),
      radial-gradient(circle at 50% 92%, rgba(126, 255, 0, .20), transparent 34%),
      linear-gradient(145deg, #120521 0%, #071829 48%, #18051f 100%) !important;
    color: #fff !important;
  }
  .app { padding-top: 8px !important; }
  .intro h1 {
    color: #fff !important;
    text-shadow: 0 0 10px #ff00c8, 0 0 22px #00eaff;
  }
  .intro p, .status { color: #e9f8ff !important; }
  .status[data-tone="ok"] { color: #7dff9a !important; }
  .status[data-tone="error"] { color: #ff8b9d !important; }

  .date-list {
    background: linear-gradient(135deg, #26003f, #003b50 48%, #2a0046) !important;
    border: 3px solid #00f0ff !important;
    box-shadow: 0 0 0 2px #ff25da, 0 0 24px rgba(0, 240, 255, .42) !important;
  }
  .date-card {
    border-width: 4px !important;
    border-color: #9b5cff !important;
    background:
      linear-gradient(110deg, rgba(48, 9, 82, .96), rgba(5, 57, 77, .96)) !important;
    box-shadow:
      inset 0 0 0 2px rgba(255,255,255,.12),
      0 0 13px rgba(155, 92, 255, .50) !important;
  }
  .date-card[data-state="available"] {
    background: linear-gradient(105deg, #00d66f 0%, #76ff83 48%, #00c8a5 100%) !important;
    border-color: #00ff85 !important;
    box-shadow: inset 0 0 0 2px #004d2b, 0 0 18px rgba(0,255,133,.72) !important;
  }
  .date-card[data-state="unsure"] {
    background: linear-gradient(105deg, #ffb800 0%, #fff15a 48%, #ff7a00 100%) !important;
    border-color: #fff400 !important;
    box-shadow: inset 0 0 0 2px #714500, 0 0 18px rgba(255,244,0,.70) !important;
  }
  .date-card[data-state="unavailable"] {
    background: linear-gradient(105deg, #ff1744 0%, #ff5f70 48%, #ff006e 100%) !important;
    border-color: #ff2f91 !important;
    box-shadow: inset 0 0 0 2px #72001e, 0 0 18px rgba(255,23,68,.72) !important;
  }
  .date-card[data-state="unmarked"] {
    background:
      repeating-linear-gradient(135deg, #3c1660 0, #3c1660 11px, #103d55 11px, #103d55 22px) !important;
    border-color: #c94dff !important;
    box-shadow: inset 0 0 0 2px #00d9ff, 0 0 14px rgba(201,77,255,.55) !important;
  }

  .date-copy strong, .date-copy span,
  .date-card[data-state="unmarked"] .response { color: #fff !important; text-shadow: 0 1px 2px #000; }
  .date-card:not([data-state="unmarked"]) .date-copy strong,
  .date-card:not([data-state="unmarked"]) .date-copy span,
  .date-card:not([data-state="unmarked"]) .response { color: #101010 !important; text-shadow: none !important; }
  .response {
    border-radius: 999px !important;
    padding: 5px 8px !important;
    background: rgba(0,0,0,.16) !important;
    border: 2px solid currentColor !important;
  }

  .quick-actions button {
    border: 3px solid rgba(255,255,255,.72) !important;
    box-shadow: inset 0 -4px 0 rgba(0,0,0,.24) !important;
    opacity: .76;
  }
  .quick-actions button[data-value="available"] {
    background: linear-gradient(180deg, #35ff84, #00a94e) !important;
    color: #001c0c !important;
  }
  .quick-actions button[data-value="unsure"] {
    background: linear-gradient(180deg, #fff66b, #ffad00) !important;
    color: #241400 !important;
  }
  .quick-actions button[data-value="unavailable"] {
    background: linear-gradient(180deg, #ff6480, #df0037) !important;
    color: #fff !important;
  }
  .quick-actions button[aria-pressed="true"] {
    opacity: 1 !important;
    transform: none !important;
    border-color: #fff !important;
    box-shadow:
      inset 0 0 0 4px rgba(255,255,255,.88),
      0 0 0 3px #111,
      0 0 18px 7px currentColor !important;
    filter: saturate(1.45) brightness(1.18) !important;
  }

  .panel, .recovery, .empty, .choice-card {
    background: linear-gradient(135deg, #24113a, #092f42) !important;
    color: #fff !important;
    border: 2px solid #7c4dff !important;
  }
  .panel-head, .choice-copy, .recovery p, .empty { color: #eefcff !important; }
  .badge { background: #ff25da !important; color: #fff !important; }
</style>`;

export function renderAvailabilityPage() {
  return renderAvailabilityPageCore()
    .replace(
      'data-date-list role="table" aria-label="Upcoming league nights"',
      'data-date-list data-register data-roster-status data-free-agent-status role="table" aria-label="Upcoming league nights"',
    )
    .replace('</head>', `${trippyCheckinTheme}</head>`);
}
