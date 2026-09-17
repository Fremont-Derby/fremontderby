export function renderLandingPage(env = {}) {
  const metadata = env.CF_VERSION_METADATA || {};
  const versionId = metadata.id || 'local';
  const versionLabel = versionId === 'local' ? 'local development' : versionId;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Fremont Derby</title>
  <style>
    :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #07150f; color: #f4f7f5; }
    main { width: min(680px, calc(100% - 32px)); border: 1px solid #315d45; border-radius: 18px; background: #0b2418; padding: 36px; box-shadow: inset 0 0 0 6px #132d20; }
    .balls { display: flex; gap: 10px; margin-bottom: 24px; }
    .ball { width: 42px; height: 42px; border-radius: 50%; display: grid; place-items: center; font-weight: 800; color: #111; background: #fff; border: 3px solid #d9dedb; }
    .ball.nine { background: linear-gradient(#f4d64b 0 34%, #fff 34% 66%, #f4d64b 66%); }
    h1 { margin: 0; font-size: clamp(2.2rem, 8vw, 4.5rem); line-height: .95; letter-spacing: -.04em; }
    p { color: #b8c8be; line-height: 1.6; }
    nav { display: flex; flex-wrap: wrap; gap: 10px; margin: 22px 0 0; }
    nav a { min-height: 44px; display: inline-flex; align-items: center; padding: 0 14px; border: 1px solid #315d45; border-radius: 999px; color: #d4f6df; text-decoration: none; font-weight: 800; }
    code { color: #d4f6df; overflow-wrap: anywhere; }
    .status { margin-top: 28px; border-top: 1px solid #315d45; padding-top: 18px; font-size: .9rem; }
  </style>
</head>
<body>
  <main data-fd-dru-home="true">
    <div class="balls" aria-hidden="true"><span class="ball">8</span><span class="ball nine">9</span></div>
    <h1>Fremont Derby</h1>
    <p>Find your night, your team, and the published standings. The deployment path is working.</p>
    <nav aria-label="League pages">
      <a href="/schedule">Schedule</a>
      <a href="/standings">Standings</a>
      <a href="/teams">Teams</a>
      <a href="/players">Players</a>
      <a href="/playoffs">Playoffs</a>
      <a href="/profile">Profile</a>
    </nav>
    <div class="status">Worker version: <code>${versionLabel}</code></div>
  </main>
</body>
</html>`;
}
