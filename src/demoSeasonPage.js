const teams = [
  'Break Room Bandits',
  'Corner Pocket Club',
  'Golden Rail',
  'Nine Ball Neighbors',
  'Side Pocket Society',
  'Table Eight',
  'The Kick Shots',
  'Three Cushion Crew',
];

const teamStandings = [
  ['Break Room Bandits', 7, 0, 14, 14],
  ['Golden Rail', 6, 1, 12, 10],
  ['Nine Ball Neighbors', 5, 2, 10, 6],
  ['Corner Pocket Club', 4, 3, 8, 2],
  ['Side Pocket Society', 3, 4, 6, -2],
  ['The Kick Shots', 2, 5, 4, -6],
  ['Table Eight', 1, 6, 2, -10],
  ['Three Cushion Crew', 0, 7, 0, -14],
];

const playerStandings = [
  ['Maya Banks', 'Break Room Bandits', 6, 1, '85.7%', '+14'],
  ['Eli Torres', 'Golden Rail', 6, 1, '85.7%', '+11'],
  ['Jordan Lee', 'Nine Ball Neighbors', 5, 2, '71.4%', '+8'],
  ['Sam Rivera', 'Corner Pocket Club', 5, 2, '71.4%', '+6'],
  ['Nina Patel', 'Side Pocket Society', 4, 2, '66.7%', '+4'],
  ['Theo Martin', 'Break Room Bandits', 4, 3, '57.1%', '+3'],
  ['Riley Chen', 'The Kick Shots', 4, 3, '57.1%', '+1'],
  ['Casey Morgan', 'Table Eight', 3, 4, '42.9%', '-2'],
];

const postseason = {
  semifinalOne: {
    teamA: 'Break Room Bandits',
    teamB: 'Corner Pocket Club',
    score: '3–1',
    winner: 'Break Room Bandits',
  },
  semifinalTwo: {
    teamA: 'Golden Rail',
    teamB: 'Nine Ball Neighbors',
    score: '2–2',
    anchors: 'Eli Torres vs Jordan Lee',
    anchorWinner: 'Golden Rail',
  },
  championship: {
    teamA: 'Break Room Bandits',
    teamB: 'Golden Rail',
    score: '3–1',
    winner: 'Break Room Bandits',
  },
};

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function buildRoundRobin(teamNames) {
  const rotation = [...teamNames];
  const rounds = [];
  for (let round = 0; round < teamNames.length - 1; round += 1) {
    const pairings = [];
    for (let index = 0; index < rotation.length / 2; index += 1) {
      const home = rotation[index];
      const away = rotation[rotation.length - 1 - index];
      const homeScore = (round + index) % 2 === 0 ? 2 : 1;
      const awayScore = 3 - homeScore;
      pairings.push({ home, away, homeScore, awayScore });
    }
    rounds.push(pairings);
    rotation.splice(1, 0, rotation.pop());
  }
  return rounds;
}

function renderSchedule() {
  return buildRoundRobin(teams).map((pairings, roundIndex) => `
    <section class="round">
      <h3>Round ${roundIndex + 1}</h3>
      ${pairings.map((pairing) => `
        <div class="pairing">
          <span>${escapeHtml(pairing.home)}</span>
          <strong>${pairing.homeScore}–${pairing.awayScore}</strong>
          <span>${escapeHtml(pairing.away)}</span>
        </div>
      `).join('')}
    </section>
  `).join('');
}

function renderTeamRows() {
  return teamStandings.map((row, index) => `
    <tr>
      <td>${index + 1}</td><td>${escapeHtml(row[0])}</td><td>${row[1]}-${row[2]}</td><td>${row[3]}</td><td>${row[4] > 0 ? '+' : ''}${row[4]}</td>
    </tr>
  `).join('');
}

function renderPlayerRows() {
  return playerStandings.map((row, index) => `
    <tr>
      <td>${index + 1}</td><td>${escapeHtml(row[0])}</td><td>${escapeHtml(row[1])}</td><td>${row[2]}-${row[3]}</td><td>${row[4]}</td><td>${row[5]}</td>
    </tr>
  `).join('');
}

export function renderDemoSeasonPage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <title>Season 1 War Games · Fremont Derby</title>
  <style>
    :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, sans-serif; background:#07150f; color:#f4f7f5; --gold:#e9bd45; --green:#2fa972; }
    * { box-sizing:border-box; }
    body { margin:0; background:linear-gradient(180deg,#081a12,#06110d); }
    main { width:min(1080px,calc(100% - 24px)); margin:auto; padding:20px 0 56px; }
    a { color:#d7f6e2; }
    button { font:inherit; cursor:pointer; }
    .demo-banner { position:sticky; top:58px; z-index:2; margin:0 -12px 20px; padding:12px; text-align:center; background:var(--gold); color:#17120a; font-weight:900; border-radius:0 0 12px 12px; }
    .hero,.card,.round,.step { border:1px solid #315d45; background:#0b2418; border-radius:14px; }
    .hero { padding:24px; }
    h1 { margin:0 0 10px; font-size:clamp(2rem,7vw,4rem); }
    h2 { margin:28px 0 12px; }
    h3 { margin:0 0 10px; color:#9ad6ae; }
    p { color:#c5d2ca; line-height:1.55; }
    .kicker { color:var(--gold); font-size:.78rem; font-weight:900; letter-spacing:.12em; text-transform:uppercase; }
    .chips { display:flex; flex-wrap:wrap; gap:8px; margin-top:16px; }
    .chip { padding:7px 10px; background:#143423; border:1px solid #315d45; border-radius:999px; font-size:.85rem; }
    .actions { display:flex; flex-wrap:wrap; gap:10px; margin-top:20px; }
    .button,.reset { min-height:46px; display:inline-flex; align-items:center; justify-content:center; padding:10px 15px; border-radius:10px; border:1px solid #315d45; text-decoration:none; font-weight:900; }
    .button.primary { background:var(--green); border-color:var(--green); color:#06120d; }
    .button.secondary { background:#143423; color:#eef7f1; }
    .reset { background:transparent; color:#f4f7f5; }
    .flow { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; }
    .step { padding:16px; display:grid; gap:10px; align-content:start; }
    .step-number { width:34px; height:34px; display:grid; place-items:center; border-radius:50%; background:#173f2a; color:#fff; font-weight:950; }
    .step-status { width:max-content; padding:5px 8px; border-radius:999px; background:#28322d; color:#cbd8d0; font-size:.72rem; font-weight:900; letter-spacing:.06em; text-transform:uppercase; }
    .step-status.done { background:#123c29; color:#a8e8bf; }
    .step-status.progress { background:#493c13; color:#f5d68a; }
    .grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(270px,1fr)); gap:12px; }
    .round,.card { padding:16px; }
    .pairing { display:grid; grid-template-columns:1fr auto 1fr; gap:8px; align-items:center; padding:8px 0; border-top:1px solid #234b36; font-size:.9rem; }
    .pairing span:last-child { text-align:right; }
    table { width:100%; border-collapse:collapse; min-width:620px; }
    th,td { padding:10px; border-bottom:1px solid #234b36; text-align:left; }
    th { color:#9fb2a6; font-size:.78rem; text-transform:uppercase; }
    .scroll { overflow-x:auto; }
    .rack { display:flex; flex-wrap:wrap; gap:7px; margin-top:10px; }
    .ball { width:34px; height:34px; border-radius:50%; display:grid; place-items:center; background:#e7f2eb; color:#07150f; font-weight:900; }
    .ball.nine { background:linear-gradient(#f4d64b 0 34%,#fff 34% 66%,#f4d64b 66%); }
    .lineup { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
    .lineup div,.postseason-match { padding:10px; background:#102f20; border-radius:10px; }
    .postseason-match { margin-top:10px; }
    .anchor { border-left:4px solid var(--gold); padding-left:12px; }
    .champion { border:1px solid var(--gold); background:#30280f; }
    .note { font-size:.9rem; color:#9fb2a6; }
    @media(max-width:760px){.flow,.lineup{grid-template-columns:1fr}.demo-banner{top:56px}}
  </style>
</head>
<body>
  <main>
    <div class="demo-banner">SEASON 1 WAR GAMES · THROWAWAY FAKE DATA · SAFE TO RESET OR DELETE BEFORE LAUNCH</div>
    <section class="hero">
      <div class="kicker">Fremont Derby dry run</div>
      <h1>Season 1 War Games</h1>
      <p>This combines the old demo season and practice sandboxes into one disposable Season 1 test drive. Use the same fictional teams and players to submit a lineup, score a match, then inspect the completed seven-round season and postseason. No Google sign-in is required and these War Games screens never write to competitive league data.</p>
      <div class="actions"><a class="button primary" href="/sandbox/captain">Start the test drive →</a><a class="button secondary" href="/sandbox/player">Jump to scoring</a><button class="reset" data-reset-all type="button">Reset all War Games</button></div>
      <div class="chips"><span class="chip">8 fake teams</span><span class="chip">7 rounds</span><span class="chip">3 active players/team</span><span class="chip">28 team matchups</span><span class="chip">8/9 dual scoring</span><span class="chip">4 postseason players/team</span><span class="chip">Anchor tiebreaker</span></div>
    </section>

    <h2>Your test drive</h2>
    <section class="flow" aria-label="Season 1 War Games test drive">
      <article class="step"><span class="step-number">1</span><div><h3>Captain + lineup</h3><p>A valid three-player lineup is prefilled, including a free-agent substitute. Submit it in one tap or change availability first.</p></div><span class="step-status" data-captain-status>Ready</span><a class="button secondary" href="/sandbox/captain">Open lineup</a></article>
      <article class="step"><span class="step-number">2</span><div><h3>Score Match 1</h3><p>Score both team-owned histories manually, create a mismatch, or load a complete matching score and test confirmation/finalization quickly.</p></div><span class="step-status" data-player-status>Ready</span><a class="button secondary" href="/sandbox/player">Open scoring</a></article>
      <article class="step"><span class="step-number">3</span><div><h3>Inspect Season 1</h3><p>Use the fixture below as the completed outcome: standings, every round, a substitute, an 8/9 race, semifinals, anchor tiebreaker, and champion.</p></div><span class="step-status done">Available below</span><a class="button secondary" href="#team-standings">View results</a></article>
    </section>

    <h2 id="team-standings">Team standings</h2>
    <section class="card scroll"><table><thead><tr><th>#</th><th>Team</th><th>W-L</th><th>Pts</th><th>Diff</th></tr></thead><tbody>${renderTeamRows()}</tbody></table></section>

    <h2>Individual standings</h2>
    <section class="card scroll"><table><thead><tr><th>#</th><th>Player</th><th>Team</th><th>Record</th><th>Win %</th><th>Game diff</th></tr></thead><tbody>${renderPlayerRows()}</tbody></table></section>

    <h2>Seven-round schedule</h2>
    <div class="grid">${renderSchedule()}</div>

    <h2>War Games lineup</h2>
    <section class="card">
      <div class="lineup">
        <div><strong>Break Room Bandits</strong><p>Maya Banks<br>Theo Martin<br>Jamie Park (sub)</p></div>
        <div><strong>Golden Rail</strong><p>Eli Torres<br>Dana Brooks<br>Owen Wells</p></div>
      </div>
      <p class="note">The interactive captain step uses these same fictional players. Jamie Park demonstrates a free-agent substitute filling one of the three active regular-season spots.</p>
    </section>

    <h2>War Games Match 1 · 8/9 race</h2>
    <section class="card">
      <h3>Maya Banks vs Eli Torres · Maya race 5 · Eli race 4</h3>
      <p>Example final: Maya 5, Eli 3. The quick-load button in scoring uses this exact rack sequence, so the interactive dry run and completed Season 1 fixture stay aligned.</p>
      <div class="rack" aria-label="Example rack winners">
        <span class="ball">M</span><span class="ball nine">E</span><span class="ball">M</span><span class="ball nine">M</span><span class="ball">E</span><span class="ball nine">M</span><span class="ball">E</span><span class="ball nine">M</span>
      </div>
      <p class="note">Each team maintains its own rack history. Eligible teammates can score their side; finalization requires the two team-owned histories to agree and both teams to confirm.</p>
    </section>

    <h2>Postseason outcome</h2>
    <section class="card">
      <p>Top four teams advance. Each postseason team submits four qualified players and locks one anchor before scoring begins.</p>
      <div class="postseason-match"><strong>Semifinal · #1 vs #4</strong><p>${postseason.semifinalOne.teamA} ${postseason.semifinalOne.score} ${postseason.semifinalOne.teamB}<br><strong>Winner: ${postseason.semifinalOne.winner}</strong></p></div>
      <div class="postseason-match anchor"><strong>Semifinal · #2 vs #3</strong><p>${postseason.semifinalTwo.teamA} ${postseason.semifinalTwo.score} ${postseason.semifinalTwo.teamB}. The four scheduled matches stay recorded as a 2–2 tie.</p><p><strong>Declared anchors:</strong> ${postseason.semifinalTwo.anchors}<br><strong>Anchor winner:</strong> ${postseason.semifinalTwo.anchorWinner}</p></div>
      <div class="postseason-match champion"><strong>Championship</strong><p>${postseason.championship.teamA} ${postseason.championship.score} ${postseason.championship.teamB}<br><strong>Season champion: ${postseason.championship.winner}</strong></p></div>
      <p class="note">The anchor match is an additional deciding match only. It never replaces or rewrites the four scheduled postseason player results.</p>
    </section>
  </main>
  <script>
    const captainKey='fd.captainSandbox.v1';const playerKey='fd.playerSandbox.v1';
    function stored(key){try{return JSON.parse(sessionStorage.getItem(key)||'null')}catch{return null}}
    function paint(el,state){el.className='step-status'+(state==='Done'?' done':state==='In progress'?' progress':'');el.textContent=state}
    function progress(){const captain=stored(captainKey),player=stored(playerKey);paint(document.querySelector('[data-captain-status]'),captain&&captain.submitted?'Done':'Ready');const playerState=player&&player.finalized?'Done':player&&((player.A&&player.A.racks&&player.A.racks.length)||(player.B&&player.B.racks&&player.B.racks.length))?'In progress':'Ready';paint(document.querySelector('[data-player-status]'),playerState)}
    document.querySelector('[data-reset-all]').onclick=()=>{sessionStorage.removeItem(captainKey);sessionStorage.removeItem(playerKey);progress()};progress();
  </script>
</body>
</html>`;
}
