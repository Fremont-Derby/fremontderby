import { renderAvailabilityPage as renderAvailabilityPageCore } from './availabilityPageCore.js';

const trippyCheckinTheme = `<style data-checkin-trippy-theme>
  body {
    background:
      radial-gradient(circle at 7% 12%, rgba(255, 61, 113, .44), transparent 24rem),
      radial-gradient(circle at 30% 6%, rgba(255, 225, 86, .30), transparent 19rem),
      radial-gradient(circle at 84% 15%, rgba(51, 244, 199, .40), transparent 25rem),
      radial-gradient(circle at 94% 56%, rgba(77, 124, 255, .38), transparent 25rem),
      radial-gradient(circle at 64% 86%, rgba(157, 255, 87, .24), transparent 23rem),
      radial-gradient(circle at 15% 84%, rgba(255, 79, 216, .38), transparent 27rem),
      conic-gradient(from 35deg at 52% 48%, rgba(51,244,199,.12), rgba(255,225,86,.10), rgba(255,79,216,.14), rgba(77,124,255,.11), rgba(51,244,199,.12)),
      repeating-linear-gradient(115deg, rgba(255,255,255,.045) 0 1px, transparent 1px 18px),
      repeating-radial-gradient(circle at 50% 50%, rgba(255,255,255,.035) 0 1px, transparent 1px 22px),
      linear-gradient(135deg, #07050f 0%, #1c0b3e 28%, #3b0d48 54%, #062a36 78%, #07050f 100%) !important;
    background-attachment: fixed !important;
    color: #fff !important;
  }
  .app { padding-top: 8px !important; }
  .intro h1 {
    color: #fff !important;
    background: linear-gradient(90deg, #33f4c7, #ffe156 24%, #ff4fd8 55%, #4d7cff 78%, #33f4c7) !important;
    -webkit-background-clip: text !important;
    background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
    filter: drop-shadow(0 0 7px rgba(255,79,216,.78)) drop-shadow(0 0 12px rgba(51,244,199,.56));
  }
  .intro p, .status { color: #e9f8ff !important; text-shadow: 0 1px 3px #07050f; }
  .status[data-tone="ok"] { color: #7dff9a !important; }
  .status[data-tone="error"] { color: #ff8b9d !important; }

  .date-list {
    background:
      radial-gradient(circle at 10% 15%, rgba(255,79,216,.34), transparent 34%),
      radial-gradient(circle at 88% 82%, rgba(51,244,199,.32), transparent 40%),
      conic-gradient(from 210deg at 50% 50%, #21033f, #063d4b, #47133f, #12204e, #21033f) !important;
    border: 3px solid #33f4c7 !important;
    box-shadow: 0 0 0 2px #ff4fd8, 0 0 0 5px rgba(255,225,86,.36), 0 0 28px rgba(51,244,199,.48) !important;
  }
  .date-card {
    border-width: 4px !important;
    border-color: #9b5cff !important;
    background:
      radial-gradient(circle at 8% 20%, rgba(255,79,216,.38), transparent 34%),
      radial-gradient(circle at 92% 80%, rgba(51,244,199,.30), transparent 40%),
      linear-gradient(110deg, rgba(48,9,82,.97), rgba(5,57,77,.97) 58%, rgba(36,17,77,.97)) !important;
    box-shadow:
      inset 0 0 0 2px rgba(255,255,255,.12),
      0 0 13px rgba(155,92,255,.50) !important;
  }
  .date-card[data-state="available"] {
    background:
      radial-gradient(circle at 12% 20%, rgba(214,255,92,.58), transparent 36%),
      radial-gradient(circle at 88% 78%, rgba(0,238,255,.36), transparent 42%),
      linear-gradient(105deg, #00a94e 0%, #35ff84 28%, #b7ff4a 54%, #00e0b8 78%, #00a94e 100%) !important;
    border-color: #37ff94 !important;
    box-shadow: inset 0 0 0 2px #004d2b, 0 0 18px rgba(0,255,133,.72), 0 0 30px rgba(51,244,199,.34) !important;
  }
  .date-card[data-state="unsure"] {
    background:
      radial-gradient(circle at 12% 18%, rgba(255,79,216,.28), transparent 34%),
      radial-gradient(circle at 90% 80%, rgba(255,112,0,.44), transparent 42%),
      linear-gradient(105deg, #ff9d00 0%, #ffe156 28%, #fff877 50%, #ffb000 76%, #ff5e00 100%) !important;
    border-color: #fff45c !important;
    box-shadow: inset 0 0 0 2px #714500, 0 0 18px rgba(255,244,0,.72), 0 0 30px rgba(255,79,216,.24) !important;
  }
  .date-card[data-state="unavailable"] {
    background:
      radial-gradient(circle at 10% 16%, rgba(255,225,86,.26), transparent 32%),
      radial-gradient(circle at 90% 84%, rgba(158,0,255,.36), transparent 42%),
      linear-gradient(105deg, #d90035 0%, #ff355f 26%, #ff5b8a 50%, #ff1493 76%, #b80068 100%) !important;
    border-color: #ff70b8 !important;
    box-shadow: inset 0 0 0 2px #72001e, 0 0 18px rgba(255,23,68,.74), 0 0 30px rgba(255,79,216,.34) !important;
  }
  .date-card[data-state="unmarked"] {
    background:
      radial-gradient(circle at 16% 25%, rgba(255,79,216,.26), transparent 34%),
      radial-gradient(circle at 84% 74%, rgba(51,244,199,.26), transparent 38%),
      repeating-linear-gradient(135deg, rgba(137,68,204,.78) 0 10px, rgba(16,61,85,.82) 10px 20px),
      linear-gradient(110deg, #32104f, #06394d) !important;
    border-color: #c94dff !important;
    box-shadow: inset 0 0 0 2px #00d9ff, 0 0 14px rgba(201,77,255,.55), 0 0 24px rgba(51,244,199,.22) !important;
  }

  .date-copy strong, .date-copy span,
  .date-card[data-state="unmarked"] .response { color: #fff !important; text-shadow: 0 1px 2px #000; }
  .date-card:not([data-state="unmarked"]) .date-copy strong,
  .date-card:not([data-state="unmarked"]) .date-copy span,
  .date-card:not([data-state="unmarked"]) .response { color: #101010 !important; text-shadow: none !important; }
  .response {
    border-radius: 999px !important;
    padding: 5px 8px !important;
    background: linear-gradient(135deg, rgba(255,255,255,.22), rgba(0,0,0,.20)) !important;
    border: 2px solid currentColor !important;
    backdrop-filter: blur(3px);
  }

  .quick-actions button {
    border: 3px solid rgba(255,255,255,.72) !important;
    box-shadow: inset 0 -4px 0 rgba(0,0,0,.24) !important;
    opacity: .82;
  }
  .quick-actions button[data-value="available"] {
    background: linear-gradient(145deg, #d7ff4f 0%, #35ff84 32%, #00c76a 68%, #00a3a8 100%) !important;
    color: #001c0c !important;
  }
  .quick-actions button[data-value="unsure"] {
    background: linear-gradient(145deg, #fff99b 0%, #ffe156 34%, #ffb000 70%, #ff7a00 100%) !important;
    color: #241400 !important;
  }
  .quick-actions button[data-value="unavailable"] {
    background: linear-gradient(145deg, #ff9db4 0%, #ff5b8a 34%, #ff1744 68%, #c70083 100%) !important;
    color: #fff !important;
  }
  .quick-actions button[aria-pressed="true"] {
    opacity: 1 !important;
    transform: none !important;
    border-color: #fff !important;
    box-shadow:
      inset 0 0 0 4px rgba(255,255,255,.92),
      inset 0 0 20px rgba(255,255,255,.36),
      0 0 0 3px #111,
      0 0 18px 7px currentColor,
      0 0 34px 10px rgba(255,79,216,.32) !important;
    filter: saturate(1.55) brightness(1.22) !important;
  }

  .panel, .recovery, .empty, .choice-card {
    background:
      radial-gradient(circle at 10% 20%, rgba(255,79,216,.26), transparent 38%),
      radial-gradient(circle at 88% 80%, rgba(51,244,199,.24), transparent 42%),
      linear-gradient(135deg, #24113a, #092f42) !important;
    color: #fff !important;
    border: 2px solid #7c4dff !important;
  }
  .panel-head, .choice-copy, .recovery p, .empty { color: #eefcff !important; }
  .badge {
    background: linear-gradient(90deg, #ff4fd8, #8d5cff 48%, #33f4c7) !important;
    color: #fff !important;
  }
</style>`;

export function renderAvailabilityPage() {
  return renderAvailabilityPageCore()
    .replace(
      'data-date-list role="table" aria-label="Upcoming league nights"',
      'data-date-list data-register data-roster-status data-free-agent-status role="table" aria-label="Upcoming league nights"',
    )
    .replace('</head>', `${trippyCheckinTheme}</head>`);
}
