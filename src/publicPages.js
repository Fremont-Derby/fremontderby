function pageShell(title, body) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${title} · Fremont Derby</title>
  <style>
    :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #07150f; color: #f4f7f5; }
    main { width: min(720px, calc(100% - 28px)); margin: 0 auto; padding: 28px 0 56px; }
    nav { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 28px; }
    nav a, .button { display: inline-block; min-height: 44px; padding: 11px 15px; border: 1px solid #315d45; border-radius: 12px; color: #f4f7f5; text-decoration: none; background: #0b2418; }
    nav a:focus-visible, .button:focus-visible { outline: 3px solid #9ad6ae; outline-offset: 2px; }
    h1 { margin: 0 0 14px; font-size: clamp(2rem, 9vw, 4rem); line-height: 1; letter-spacing: -.035em; }
    h2 { margin: 30px 0 10px; font-size: 1.35rem; }
    p, li { color: #c5d2ca; line-height: 1.6; }
    ul { padding-left: 22px; }
    .lead { font-size: 1.1rem; color: #edf4ef; }
    .actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 24px; }
    .button.primary { background: #e7f2eb; color: #07150f; border-color: #e7f2eb; font-weight: 700; }
    .note { margin-top: 34px; padding-top: 18px; border-top: 1px solid #315d45; font-size: .95rem; color: #9fb2a6; }
  </style>
</head>
<body>
  <main>
    <nav aria-label="Main navigation">
      <a href="/">Intro</a>
      <a href="/rules">Rules</a>
      <a href="/standings">Standings</a>
      <a href="/scorecard">Scorecard</a>
    </nav>
    ${body}
  </main>
</body>
</html>`;
}

export function renderIntroPage() {
  return pageShell('Welcome', `
    <h1>Fremont Derby</h1>
    <p class="lead">A simple, player-run pool league built to be flexible and fun.</p>
    <p>Teams play each opponent once. Matches are Fargo-handicapped, players and captains handle their own lineups and scoring, and teams can play their matchup early, late, or at another agreed location.</p>
    <p>The website keeps the schedule, scores, standings, and league history in one place so the league mostly runs itself.</p>
    <div class="actions">
      <a class="button primary" href="/rules">Read the rules</a>
      <a class="button" href="/standings">View standings</a>
    </div>
  `);
}

export function renderRulesPage() {
  return pageShell('League Rules', `
    <h1>League Rules</h1>
    <p class="lead">Keep it simple, get the matches played, and make the results easy to verify.</p>

    <h2>Season</h2>
    <ul>
      <li>Eight teams play a seven-match single round robin: every team plays every other team once.</li>
      <li>Each team matchup has four individual player matches.</li>
      <li>The published league-night date and reserved tables are the default option, not a requirement.</li>
      <li>Teams may play early, late, out of round order, or at another mutually agreed venue.</li>
      <li>The result always counts toward the originally scheduled matchup, regardless of when or where it is played.</li>
    </ul>

    <h2>Players and lineups</h2>
    <ul>
      <li>Teams have up to four primary roster players for Season 1.</li>
      <li>Captains submit up to four players for each matchup.</li>
      <li>Eligible free agents/substitutes may fill an open lineup spot without permanently joining that team.</li>
      <li>A player cannot play for two teams in the same scheduled round.</li>
      <li>Player team changes preserve all prior match and team history.</li>
      <li>There is no team-strength or Fargo cap.</li>
    </ul>

    <h2>Matches and handicaps</h2>
    <ul>
      <li>Individual matches use the Fremont Derby 8-ball / 9-ball format.</li>
      <li>Race targets are calculated from the players' locked Fargo ratings using the season race chart.</li>
      <li>The scorecard shows the current game, score, race targets, and rack history.</li>
      <li>Every rack counts toward the player's 8-ball or 9-ball statistics.</li>
    </ul>

    <h2>Scoring</h2>
    <ul>
      <li>Players track the match rack by rack from their phones.</li>
      <li>Both players' rack records must agree before the match can be finalized.</li>
      <li>Any mismatched or missing rack must be corrected first.</li>
      <li>Both players confirm the reconciled result before submission.</li>
      <li>Finalized results may only be corrected through the audited admin correction process.</li>
    </ul>

    <h2>Standings</h2>
    <ul>
      <li>Team standings are calculated from finalized match results.</li>
      <li>Individual standings include only matches actually played; missing a week is neither a win nor a loss.</li>
      <li>Individual ranking uses win percentage, with total wins as the first tiebreaker.</li>
      <li>Season 1 individual prize eligibility defaults to at least five matches played.</li>
    </ul>

    <h2>Playoffs</h2>
    <ul>
      <li>The top four teams advance after the regular season.</li>
      <li>Semifinals are #1 vs #4 and #2 vs #3.</li>
      <li>If the championship team score is tied, each captain selects an eligible anchor player for the deciding handicapped match.</li>
    </ul>

    <h2>Sportsmanship and disputes</h2>
    <ul>
      <li>Players are expected to resolve ordinary scheduling and scoring issues with each other first.</li>
      <li>The site preserves scoring, roster, rating, team-move, and correction history so disputes can be reviewed from the actual record.</li>
      <li>League admins handle exceptions and disputes when players cannot resolve them themselves.</li>
    </ul>

    <p class="note">Season-specific settings such as dates, deadlines, race-chart values, and payout amounts are published separately and may change between seasons.</p>
  `);
}
