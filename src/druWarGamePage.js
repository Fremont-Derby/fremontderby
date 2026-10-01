const teams = [
  'Bluebird Break',
  'Bubble Chalk',
  'Cookie Cue Club',
  'Friendly Felt',
  'Lemon Lime Laces',
  'Maple Cue Cats',
  'Paper Lanterns',
  'Sunny Rail Ducks',
];

const weeks = [
  ['Bluebird Break 3–1 Bubble Chalk', 'Cookie Cue Club 3–2 Friendly Felt', 'Lemon Lime Laces 3–1 Maple Cue Cats', 'Paper Lanterns 3–2 Sunny Rail Ducks'],
  ['Bluebird Break 3–2 Cookie Cue Club', 'Bubble Chalk 2–3 Lemon Lime Laces', 'Friendly Felt 3–1 Paper Lanterns', 'Maple Cue Cats 3–2 Sunny Rail Ducks'],
  ['Bluebird Break 3–1 Lemon Lime Laces', 'Cookie Cue Club 3–2 Maple Cue Cats', 'Bubble Chalk 3–1 Friendly Felt', 'Paper Lanterns 2–3 Sunny Rail Ducks'],
  ['Bluebird Break 3–2 Friendly Felt', 'Lemon Lime Laces 3–1 Cookie Cue Club', 'Maple Cue Cats 3–2 Bubble Chalk', 'Sunny Rail Ducks 3–1 Paper Lanterns'],
  ['Bluebird Break 3–1 Maple Cue Cats', 'Cookie Cue Club 3–2 Sunny Rail Ducks', 'Lemon Lime Laces 3–2 Friendly Felt', 'Bubble Chalk 3–1 Paper Lanterns'],
  ['Bluebird Break 3–2 Sunny Rail Ducks', 'Cookie Cue Club 3–1 Bubble Chalk', 'Friendly Felt 2–3 Maple Cue Cats', 'Lemon Lime Laces 3–1 Paper Lanterns'],
  ['Bluebird Break 3–1 Paper Lanterns', 'Bubble Chalk 3–2 Sunny Rail Ducks', 'Cookie Cue Club 3–2 Lemon Lime Laces', 'Friendly Felt 3–1 Maple Cue Cats'],
];

export function druWarGameEnabled(env = {}) {
  return String(env.ENVIRONMENT || '').trim() === 'dru';
}

export function renderDruWarGamePage() {
  const weekBlocks = weeks.map((matches, index) => `
    <section class="week" hidden data-week="${index + 1}">
      <h2>Week ${index + 1}</h2>
      ${matches.map((match) => `<p>${match}</p>`).join('')}
    </section>`).join('');
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>DRU war game · Fremont Derby</title>
  <style>
    body { margin: 0; font-family: Inter, system-ui, sans-serif; background: #07150f; color: #f4f7f5; }
    main { width: min(720px, calc(100% - 24px)); margin: auto; padding: 24px 0 48px; }
    button { min-height: 48px; font: inherit; font-weight: 800; }
    .note { color: #e9bd45; font-weight: 800; }
  </style>
</head>
<body>
  <main>
    <p class="note">DRU practice only. This does not change Season 1 or write a phone number.</p>
    <h1>Kids Demo Night war game</h1>
    <p data-status>Ready. No week has been scored.</p>
    <p>${teams.join(', ')}</p>
    ${weekBlocks}
    <section data-playoffs hidden>
      <h2>Playoffs</h2>
      <p>Semifinal: Bluebird Break 3–1 Lemon Lime Laces</p>
      <p>Semifinal: Cookie Cue Club 3–2 Bubble Chalk</p>
      <p><strong>Season champion: Bluebird Break</strong></p>
    </section>
    <button type="button" data-next>Score next week</button>
  </main>
  <script>
    const weeks = [...document.querySelectorAll('[data-week]')];
    const playoffs = document.querySelector('[data-playoffs]');
    const status = document.querySelector('[data-status]');
    const button = document.querySelector('[data-next]');
    let shown = 0;
    button.addEventListener('click', () => {
      if (shown < weeks.length) {
        weeks[shown].hidden = false;
        shown += 1;
        status.textContent = 'Week ' + shown + ' scored.';
        if (shown === weeks.length) button.textContent = 'Open playoffs';
        return;
      }
      playoffs.hidden = false;
      status.textContent = 'Season champion: Bluebird Break.';
      button.disabled = true;
    });
  </script>
</body>
</html>`;
}
