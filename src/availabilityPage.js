import { renderAvailabilityPage as renderAvailabilityPageCore } from './availabilityPageCore.js';

const readableCheckinTheme = `<style data-checkin-readable-theme>
  body {
    background: #f7f7f4 !important;
    color: #121814 !important;
  }

  .app {
    padding-top: 18px !important;
  }

  .intro {
    gap: 8px !important;
    margin-bottom: 18px !important;
  }

  .intro h1 {
    margin: 0 !important;
    color: #0a4f31 !important;
    background: none !important;
    -webkit-text-fill-color: currentColor !important;
    filter: none !important;
    text-shadow: none !important;
    font-size: clamp(2rem, 8vw, 2.6rem) !important;
    line-height: 1 !important;
    letter-spacing: -.04em !important;
  }

  .intro p {
    margin: 0 !important;
    color: #171b18 !important;
    text-shadow: none !important;
    font-size: 1rem !important;
    line-height: 1.45 !important;
    font-weight: 500 !important;
  }

  .status {
    margin-top: 2px !important;
    color: #175f3d !important;
    text-shadow: none !important;
    font-size: .98rem !important;
    line-height: 1.3 !important;
    font-weight: 900 !important;
  }

  .status[data-tone="ok"] { color: #175f3d !important; }
  .status[data-tone="error"] { color: #9f2019 !important; }

  .date-list {
    display: grid !important;
    gap: 10px !important;
    padding: 0 !important;
    border: 0 !important;
    border-radius: 0 !important;
    overflow: visible !important;
    background: transparent !important;
    box-shadow: none !important;
  }

  .date-card {
    grid-template-columns: minmax(0,1fr) auto minmax(220px,250px) !important;
    gap: 12px !important;
    height: auto !important;
    min-height: 112px !important;
    max-height: none !important;
    padding: 16px 18px !important;
    border: 2px solid #83958c !important;
    border-radius: 20px !important;
    background: #eef1ef !important;
    box-shadow: none !important;
  }

  .date-card[data-state="available"] {
    background: #b9e5ad !important;
    border-color: #5d9b57 !important;
    box-shadow: none !important;
  }

  .date-card[data-state="unsure"] {
    background: #ffe7a0 !important;
    border-color: #d69b18 !important;
    box-shadow: none !important;
  }

  .date-card[data-state="unavailable"] {
    background: #f6ada6 !important;
    border-color: #d35c52 !important;
    box-shadow: none !important;
  }

  .date-card[data-state="unmarked"] {
    background: #e7ebe8 !important;
    border-color: #83958c !important;
    box-shadow: none !important;
  }

  .date-copy {
    gap: 6px !important;
  }

  .date-copy strong {
    color: #101410 !important;
    text-shadow: none !important;
    font-size: 1.35rem !important;
    line-height: 1.05 !important;
    font-weight: 950 !important;
  }

  .date-copy span {
    color: #20251f !important;
    text-shadow: none !important;
    font-size: .96rem !important;
    line-height: 1.25 !important;
  }

  .response,
  .date-card[data-state="unmarked"] .response,
  .date-card:not([data-state="unmarked"]) .response {
    min-width: 0 !important;
    padding: 9px 13px !important;
    border: 3px solid #111713 !important;
    border-radius: 999px !important;
    background: transparent !important;
    color: #111713 !important;
    text-shadow: none !important;
    backdrop-filter: none !important;
    font-size: .8rem !important;
    line-height: 1 !important;
    font-weight: 950 !important;
  }

  .response::before {
    width: 10px !important;
    height: 10px !important;
    margin-right: 7px !important;
  }

  .response[data-state="available"]::before,
  .response[data-state="unavailable"]::before {
    display: none !important;
  }

  .quick-actions {
    grid-template-columns: repeat(3,minmax(64px,1fr)) !important;
    gap: 8px !important;
    height: 62px !important;
  }

  .quick-actions button {
    min-width: 64px !important;
    height: 62px !important;
    min-height: 62px !important;
    padding: 0 10px !important;
    border: 3px solid rgba(255,255,255,.7) !important;
    border-radius: 15px !important;
    opacity: 1 !important;
    box-shadow: none !important;
    text-shadow: none !important;
    filter: none !important;
    transform: none !important;
    font-size: .82rem !important;
    line-height: 1 !important;
    font-weight: 950 !important;
  }

  .quick-actions button[data-value="available"] {
    background: #70c95a !important;
    border-color: rgba(255,255,255,.72) !important;
    color: #0b1d0c !important;
  }

  .quick-actions button[data-value="unsure"] {
    background: #f5c93c !important;
    border-color: rgba(255,255,255,.72) !important;
    color: #191609 !important;
  }

  .quick-actions button[data-value="unavailable"] {
    background: #ef4a45 !important;
    border-color: rgba(255,255,255,.72) !important;
    color: #fff !important;
  }

  .quick-actions button[aria-pressed="true"] {
    border-color: #fff !important;
    box-shadow: 0 0 0 4px #111713 !important;
    filter: none !important;
  }

  .quick-actions button[aria-pressed="true"]::after {
    content: '' !important;
  }

  .panel, .recovery, .empty, .choice-card {
    background: #fff !important;
    color: #121814 !important;
    border: 1px solid #c8d0cc !important;
    box-shadow: none !important;
  }

  .panel-head, .choice-copy, .recovery p, .empty {
    color: #27312b !important;
  }

  .badge {
    background: #e5f1e9 !important;
    color: #174f36 !important;
  }

  @media(max-width:560px) {
    .app {
      padding: 16px 12px calc(18px + env(safe-area-inset-bottom)) !important;
    }

    .intro {
      gap: 7px !important;
      margin-bottom: 16px !important;
    }

    .intro h1 {
      font-size: 2.15rem !important;
    }

    .intro p {
      font-size: .98rem !important;
      line-height: 1.38 !important;
    }

    .status {
      font-size: .95rem !important;
    }

    .date-card {
      grid-template-columns: minmax(0,1fr) auto 164px !important;
      gap: 8px !important;
      min-height: 96px !important;
      padding: 12px !important;
      border-width: 1.5px !important;
      border-radius: 16px !important;
    }

    .date-copy strong {
      font-size: 1.08rem !important;
    }

    .date-copy span {
      font-size: .78rem !important;
    }

    .response {
      padding: 7px 9px !important;
      border-width: 2px !important;
      font-size: .68rem !important;
    }

    .response::before {
      width: 8px !important;
      height: 8px !important;
      margin-right: 5px !important;
    }

    .quick-actions {
      grid-template-columns: repeat(3,minmax(0,1fr)) !important;
      gap: 6px !important;
      height: 56px !important;
    }

    .quick-actions button {
      min-width: 0 !important;
      height: 56px !important;
      min-height: 56px !important;
      padding: 0 5px !important;
      border-radius: 13px !important;
      font-size: .72rem !important;
    }

    .quick-actions button[aria-pressed="true"] {
      box-shadow: 0 0 0 3px #111713 !important;
    }
  }
</style>`;

const unsafeParseJson = `async function parseJson(response){const text=await response.text();if(!text)return{};try{return JSON.parse(text)}catch{return{error:text}}}`;
const safeParseJson = `async function parseJson(response){const text=await response.text();if(!text)return{};try{return JSON.parse(text)}catch{const rateLimited=response.status===429||/error\\s*(code[: ]*)?1015|temporarily banned|rate limit/i.test(text);return{error:rateLimited?'Check-in is temporarily busy. Wait a moment and try again.':'Check-in service is temporarily unavailable. Try again.'}}}`;
const parallelSavedStateLoadPattern = /await Promise\.all\(groups\.map\(\(group\)=>\{const card=dateList\.querySelector\([^;]+\);return loadSavedAvailability\(group,card\)\}\)\);/;
const sequentialSavedStateLoad = `for(const group of groups){const card=dateList.querySelector('[data-group-key="'+CSS.escape(group.key)+'"]');await loadSavedAvailability(group,card)}`;

export function renderAvailabilityPage() {
  return renderAvailabilityPageCore()
    .replace(unsafeParseJson, safeParseJson)
    .replace(parallelSavedStateLoadPattern, sequentialSavedStateLoad)
    .replace(
      'data-date-list role="table" aria-label="Upcoming league nights"',
      'data-date-list data-register data-roster-status data-free-agent-status role="table" aria-label="Upcoming league nights"',
    )
    .replace('</head>', `${readableCheckinTheme}</head>`);
}
