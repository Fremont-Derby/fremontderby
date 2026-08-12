function pageShell(title, body) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <meta name="theme-color" content="#07150f" />
  <title>${title} · Fremont Derby</title>
  <style>
    :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background:
        radial-gradient(circle at 90% 6%, rgba(231,242,235,.09) 0 9px, transparent 10px),
        radial-gradient(circle at 84% 10%, rgba(49,93,69,.32) 0 24px, transparent 25px),
        linear-gradient(180deg, #081a12 0%, #07150f 38%, #06110d 100%);
      color: #f4f7f5;
      min-height: 100vh;
    }
    main { width: min(720px, calc(100% - 28px)); margin: 0 auto; padding: 28px 0 56px; }
    nav { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 28px; padding-bottom: 18px; border-bottom: 1px solid #234b36; }
    nav a, .button { display: inline-block; min-height: 44px; padding: 11px 15px; border: 1px solid #315d45; border-radius: 12px; color: #f4f7f5; text-decoration: none; background: #0b2418; }
    nav a:focus-visible, .button:focus-visible { outline: 3px solid #9ad6ae; outline-offset: 2px; }
    h1 { margin: 0 0 14px; font-size: clamp(2rem, 9vw, 4rem); line-height: 1; letter-spacing: -.035em; }
    h2 { margin: 30px 0 10px; font-size: 1.35rem; }
    p, li { color: #c5d2ca; line-height: 1.6; }
    ul { padding-left: 22px; }
    .lead { font-size: 1.1rem; color: #edf4ef; max-width: 62ch; }
    .eyebrow { display: inline-flex; align-items: center; gap: 8px; margin-bottom: 12px; color: #9ad6ae; font-size: .78rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
    .eyebrow::before { content: ''; width: 12px; height: 12px; border: 3px solid #e7f2eb; border-radius: 50%; box-shadow: inset 0 0 0 3px #173f2a; }
    .actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 24px; }
    .button.primary { background: #e7f2eb; color: #07150f; border-color: #e7f2eb; font-weight: 700; }
    .button.demo { background: #e9bd45; color: #17120a; border-color: #e9bd45; font-weight: 800; }
    .note { margin-top: 34px; padding-top: 18px; border-top: 1px solid #315d45; font-size: .95rem; color: #9fb2a6; }
  </style>
</head>
<body>
  <main>
    <nav aria-label="Main navigation">
      <a href="/">Intro</a>
      <a href="/demo">Demo Season</a>
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
    <div class="eyebrow">Cash league · 8 teams · 12 weeks</div>
    <h1>Fremont Derby</h1>
    <p class="lead"><strong>Cash pool league. One venue. Four tables. Two ways to win.</strong></p>
    <p>Eight teams play across a 12-week season. Teams put up <strong>3 players</strong> for each regular-season matchup and lock <strong>4-player postseason rosters</strong>.</p>
    <p>Every match also counts toward the <strong>individual cash competition</strong>. Flexible scheduling and simple team management make it easy to use subs and keep matches moving.</p>
    <p><strong>No team? No problem.</strong> Free agents and subs can still play, build their individual record, and compete for cash.</p>
    <div class="actions">
      <a class="button primary" href="/profile">Join / sign in</a>
      <a class="button demo" href="/demo">Test drive the app</a>
      <a class="button" href="/rules">Read the rules</a>
    </div>
  `);
}

export function renderRulesPage() {
  return pageShell('League Rules', `
    <div class="eyebrow">Fremont Derby</div>
    <h1>League Rules</h1>
    <p class="lead">Keep it simple, get the matches played, and make the results easy to verify.</p>

    <h2>Season</h2>
    <ul>
      <li>Eight teams play a seven-match single round robin: every team plays every other team once.</li>
      <li>Each team matchup has three individual player matches.</li>
      <li>The published league-night date and reserved tables are the default option, not a requirement.</li>
      <li>Teams may play early, late, out of round order, or at another mutually agreed venue.</li>
      <li>The result always counts toward the originally scheduled matchup, regardless of when or where it is played.</li>
    </ul>

    <h2>Players and lineups</h2>
    <ul>
      <li>A player does not need a permanent team to participate in the regular season.</li>
      <li>Free agents/substitutes may play for teams that need an eligible player, and those matches count toward the player's individual standings and singles eligibility.</li>
      <li>Regular-season teams may operate with three players and add or use another eligible player as needed.</li>
      <li>Players may switch teams during the regular season; all prior results remain with the team and matchup where they were earned, and the player's full team history is preserved.</li>
      <li>Captains submit the players used for each matchup.</li>
      <li>A player may shoot for different teams on the same league night, but may shoot no more than seven regular-season individual matches total across all teams.</li>
      <li>A player may not shoot twice for the same team in the same team matchup; one player cannot fill two of that team's three active lineup slots.</li>
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
      <li>Each team maintains its own rack-by-rack score record from an authenticated team member's phone.</li>
      <li>The two team-owned rack records must agree before the match can be finalized.</li>
      <li>Any mismatched or missing rack must be corrected first.</li>
      <li>Both teams confirm the reconciled result before submission.</li>
      <li>Finalized results may only be corrected through the audited admin correction process.</li>
    </ul>

    <h2>Standings and payouts</h2>
    <ul>
      <li>Team standings are calculated from finalized match results.</li>
      <li>The regular-season team champion earns a cash payout.</li>
      <li>The playoff champion earns a larger championship payout.</li>
      <li>Individual standings include every eligible match a player actually plays, whether as a rostered player, free agent, or substitute; missing a week is neither a win nor a loss.</li>
      <li>Individual ranking uses win percentage, with total wins as the first tiebreaker.</li>
      <li>Singles qualification requires playing in at least five of the seven regular-season rounds anywhere in the league.</li>
      <li>Singles also award cash for regular-season performance, with a larger payout attached to the singles championship.</li>
      <li>Exact season payouts are based on the available prize pool and are published separately.</li>
    </ul>

    <h2>Playoffs</h2>
    <ul>
      <li>The top four teams advance after the regular season.</li>
      <li>Each postseason team matchup uses four active players. A valid four-player lineup must include at least three players with four or more official regular-season matches for that team; every other selected player must have at least three official matches for that team.</li>
      <li>Postseason eligibility is a pool, not a four-player roster cap. Once a team has three players at 4+ team matches, every additional player with 3+ team matches is eligible to be selected.</li>
      <li>Qualification is team-specific. Matches played while representing another team do not count toward postseason qualification for this team.</li>
      <li>Semifinals are #1 vs #4 and #2 vs #3.</li>
      <li>Before scoring begins, each captain declares one anchor from the four players submitted for that postseason matchup; the anchor is then locked for that matchup.</li>
      <li>If the four scheduled postseason matches finish tied 2-2, the two pre-declared anchors play the deciding handicapped anchor match.</li>
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
