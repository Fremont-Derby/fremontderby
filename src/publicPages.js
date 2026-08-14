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
    :root { font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; }
    .public-page { width: min(720px, calc(100% - 28px)); margin: 0 auto; padding: 28px 0 56px; }
    .public-page h1 { margin: 0 0 14px; font-size: clamp(2rem, 9vw, 4rem); line-height: 1; letter-spacing: -.035em; }
    .public-page h2 { margin: 30px 0 10px; font-size: 1.35rem; }
    .public-page p, .public-page li { line-height: 1.6; }
    .public-page ul { padding-left: 22px; }
    .public-page .lead { max-width: 62ch; font-size: 1.1rem; }
    .public-page .eyebrow { display: inline-flex; align-items: center; gap: 8px; margin-bottom: 12px; font-size: .78rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
    .public-page .eyebrow::before { content: ''; width: 12px; height: 12px; border: 3px solid currentColor; border-radius: 50%; }
    .public-page .actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 24px; }
    .public-page .note { margin-top: 34px; padding-top: 18px; border-top: 1px solid currentColor; font-size: .95rem; }
  </style>
</head>
<body>
  <main class="public-page">
    ${body}
  </main>
</body>
</html>`;
}

export function renderIntroPage() {
  return pageShell('Welcome', `
    <div class="eyebrow">Cash league · 8 teams · 12 weeks · flexible calendar</div>
    <h1>Fremont Derby</h1>
    <p class="lead"><strong>Cash pool league. One venue. Four tables. Two ways to win.</strong></p>
    <ul>
      <li><strong>When:</strong> Weekly league nights across a 12-week season (seven-match round robin + flex / makeup / postseason).</li>
      <li><strong>Where:</strong> Fremont venue — four tables, one house.</li>
      <li><strong>Cost:</strong> Team + individual cash stakes (see Rules for current season amounts).</li>
      <li><strong>How to join:</strong> Sign in on Profile, register for the open season, then join or form a team.</li>
    </ul>
    <p>The 12-week calendar is built around a <strong>seven-match single round robin</strong>: every team plays every other team once, with the remaining calendar space reserved for flexibility, makeup dates, and postseason play.</p>
    <p>Teams put up <strong>3 players</strong> for each regular-season matchup and lock <strong>4-player postseason rosters</strong>.</p>
    <p>Every match also counts toward the <strong>individual cash competition</strong>. Flexible scheduling and simple team management make it easy to use subs and keep matches moving.</p>
    <p><strong>No team? No problem.</strong> Free agents and subs can still play, build their individual record, and compete for cash.</p>
    <div class="actions">
      <a class="button primary" href="/profile">Join / sign in</a>
      <a class="button demo" href="/demo">Test drive the app</a>
      <a class="button" href="/schedule">Schedule</a>
      <a class="button" href="/teams">Teams</a>
      <a class="button" href="/standings">Standings</a>
      <a class="button" href="/players">Players</a>
      <a class="button" href="/playoffs">Playoffs</a>
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
      <li>The published calendar spans 12 weeks to leave room for flexibility, makeup dates, and postseason play.</li>
      <li>The regular season is a seven-match single round robin: every team plays every other team once.</li>
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
