import { JFL_404_ARTWORK_DATA_URI } from './jfl404Artwork.js';

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function renderJflNotFoundPage(pathname = '') {
  const escapedPath = escapeHtml(pathname || '/');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <meta name="theme-color" content="#f5e0bd" />
  <title>404 · Fremont Derby</title>
  <style>
    :root { font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      overflow-x: hidden;
      background: linear-gradient(180deg, #f8ead2 0%, #f1d5aa 48%, #dfba82 100%);
      color: #301b12;
    }
    .lost {
      width: min(1040px, calc(100% - 28px));
      margin: 0 auto;
      padding: clamp(24px, 5vw, 52px) 0 72px;
      text-align: center;
    }
    .artwork {
      display: block;
      width: min(960px, 100%);
      height: auto;
      margin: 0 auto 26px;
      border: 1px solid rgba(80, 44, 25, .22);
      border-radius: clamp(14px, 2vw, 24px);
      box-shadow: 0 22px 55px rgba(83, 47, 24, .22);
    }
    .copy {
      width: min(720px, 100%);
      margin: 0 auto;
      padding: clamp(20px, 4vw, 30px);
      border: 1px solid rgba(80, 44, 25, .18);
      border-radius: 20px;
      background: rgba(255, 250, 240, .78);
      box-shadow: 0 14px 35px rgba(83, 47, 24, .12);
    }
    .kicker {
      color: #8f3e24;
      font-size: .78rem;
      font-weight: 950;
      letter-spacing: .11em;
      text-transform: uppercase;
    }
    h1 {
      margin: 7px 0 10px;
      color: #351e14;
      font-size: clamp(2rem, 7vw, 4.3rem);
      line-height: .98;
      letter-spacing: -.04em;
    }
    p { margin: 0; color: #6b4938; line-height: 1.6; }
    .path {
      display: inline-block;
      max-width: 100%;
      margin-top: 8px;
      overflow-wrap: anywhere;
      border: 1px solid #cfaa78;
      border-radius: 9px;
      background: #fff8ed;
      color: #4b2a1d;
      padding: 6px 9px;
      font-weight: 750;
    }
    .actions {
      margin-top: 22px;
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 9px;
    }
    .actions a {
      min-height: 48px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 11px 16px;
      border: 1px solid #a76742;
      border-radius: 11px;
      background: #fff8ed;
      color: #5b2d1d;
      font-weight: 850;
      text-decoration: none;
    }
    .actions a.primary { border-color: #71341f; background: #71341f; color: #fff8ed; }
    .actions a:hover { transform: translateY(-1px); }
    .actions a:focus-visible { outline: 3px solid #176b47; outline-offset: 3px; }
    @media (max-width: 560px) {
      .lost { width: min(100% - 18px, 1040px); padding-top: 12px; }
      .artwork { margin-bottom: 15px; border-radius: 13px; }
      .copy { padding: 18px 14px; border-radius: 15px; }
      .actions { display: grid; grid-template-columns: 1fr 1fr; }
      .actions a.primary { grid-column: 1 / -1; }
    }
    @media (prefers-reduced-motion: reduce) {
      .actions a:hover { transform: none; }
    }
  </style>
</head>
<body>
  <main class="lost">
    <img
      class="artwork"
      src="${JFL_404_ARTWORK_DATA_URI}"
      alt="Sad basset hound Buster sitting beside a wooden sign announcing a 404 error"
      width="840"
      height="458"
    />
    <section class="copy" aria-labelledby="missing-title">
      <div class="kicker">404 · Buster came up empty</div>
      <h1 id="missing-title">Page not found.</h1>
      <p>We sniffed around, but there is no Fremont Derby page at<br /><span class="path">${escapedPath}</span>.</p>
      <nav class="actions" aria-label="404 recovery links">
        <a class="primary" href="/">Back home</a>
        <a href="/teams">Teams</a>
        <a href="/schedule">Schedule</a>
        <a href="/standings">Standings</a>
      </nav>
    </section>
  </main>
</body>
</html>`;
}
