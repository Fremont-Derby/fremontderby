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
    <p class="lead">A flexible, Fargo-handicapped 8-ball / 9-ball league with team and singles competition, cash payouts, and very little paperwork.</p>

    <h2>How it works</h2>
    <p>Teams play through the regular-season schedule, but the calendar is flexible. League nights will have scheduled matchups and reserved tables for convenience and for everyone who wants the regular league-night atmosphere. Teams can also agree to play early, late, out of order, or somewhere else.</p>
    <p>Players score from their phones, both sides confirm the same rack history, and the site keeps standings and player stats automatically.</p>

    <h2>Teams</h2>
    <p>The regular season is intentionally flexible. A team can play with three players and players can move between teams during the season, so missing a week or changing teams does not have to derail anyone's season. Match and team history stays attached to the player.</p>
    <p>The playoffs tighten up: qualifying teams lock in four-player playoff rosters for the championship run.</p>

    <h2>Cash payouts</h2>
    <p>There are separate team and singles prizes. Regular-season team champions get paid, and the playoff champions earn a larger championship payout. Singles follow the same idea: regular-season individual performance earns a payout, followed by a higher-value singles championship prize.</p>
    <p>Exact payouts depend on the season's entries and prize pool and will be published for that season rather than promised in advance.</p>

    <p>The goal is simple: show up, play pool, keep your own score, and let the league mostly run itself.</p>
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
      <li>Regular-season teams may operate with three players and add or use another eligible player as needed.</li>
      <li>Players may switch teams during the regular season; all prior results remain with the team and matchup where they were earned, and the player's full team history is preserved.</li>
      <li>Captains submit the players used for each matchup.</li>
      <li>Eligible free agents/substitutes may fill an open lineup spot without permanently joining that team.</li>
      <li>A player cannot play for two teams in the same scheduled round.</li>
      <li>There is no team-strength or Fargo cap.</li>
      <li>Playoff teams lock a four-player roster for the playoff run; regular-season switching and pickup flexibility ends for the playoffs.</li>
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

    <h2>Standings and payouts</h2>
    <ul>
      <li>Team standings are calculated from finalized match results.</li>
      <li>The regular-season team champion earns a cash payout.</li>
      <li>The playoff champion earns a larger championship payout.</li>
      <li>Individual standings include only matches actually played; missing a week is neither a win nor a loss.</li>
      <li>Individual ranking uses win percentage, with total wins as the first tiebreaker.</li>
      <li>Season 1 individual prize eligibility defaults to at least five matches played.</li>
      <li>Singles also award cash for regular-season performance, with a larger payout attached to the singles championship.</li>
      <li>Exact season payouts are based on the available prize pool and are published separately.</li>
    </ul>

    <h2>Playoffs</h2>
    <ul>
      <li>The top four teams advance after the regular season.</li>
      <li>Qualifying teams lock four-player playoff rosters before playoff competition begins.</li>
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
