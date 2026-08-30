export const jflScheduleRaceStyles = `
  .fd-schedule-match__race-list {
    display: grid;
    gap: 8px;
    padding: 4px 0 8px;
  }
  .fd-schedule-race {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    align-items: stretch;
    gap: 8px;
    padding: 8px;
    border: 1px solid #e3e1da;
    border-radius: 12px;
    background: #faf9f5;
  }
  .fd-schedule-race__player {
    min-width: 0;
    display: grid;
    gap: 3px;
    align-content: center;
    padding: 7px 8px;
    border-radius: 9px;
  }
  .fd-schedule-race__player:last-child { text-align: right; }
  .fd-schedule-race__player strong {
    min-width: 0;
    overflow-wrap: anywhere;
    font-size: .9rem;
    line-height: 1.15;
  }
  .fd-schedule-race__progress {
    color: #5f625f;
    font-size: .78rem;
    font-weight: 850;
    font-variant-numeric: tabular-nums;
  }
  .fd-schedule-race__player--winner {
    background: #e7f4ed;
    color: #075f3a;
  }
  .fd-schedule-race__player--winner .fd-schedule-race__progress { color: #075f3a; }
  .fd-schedule-race__player--loser { color: #666966; }
  .fd-schedule-race__meta {
    align-self: center;
    display: grid;
    justify-items: center;
    gap: 5px;
    white-space: nowrap;
  }
  .fd-schedule-race__number {
    color: #747773;
    font-size: .68rem;
    font-weight: 900;
    text-transform: uppercase;
  }
  .fd-schedule-race__discipline {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 25px;
    min-width: 54px;
    padding: 3px 8px;
    border: 2px solid #075f3a;
    border-radius: 999px;
    background: #075f3a;
    color: #fff;
    font-size: .68rem;
    line-height: 1;
    font-weight: 950;
    letter-spacing: .045em;
    text-transform: uppercase;
    box-shadow: 0 1px 2px rgba(0,0,0,.12);
  }
  .fd-schedule-match__race-warning {
    margin: 0 0 8px;
    padding: 8px 10px;
    border: 1px solid #b86f18;
    border-radius: 9px;
    background: #fff7e7;
    color: #70410c;
    font-size: .78rem;
    font-weight: 800;
  }
  @media (max-width: 390px) {
    .fd-schedule-race { gap: 5px; padding: 6px; }
    .fd-schedule-race__player { padding-inline: 6px; }
    .fd-schedule-race__number { font-size: .62rem; }
    .fd-schedule-race__discipline { min-width: 50px; padding-inline: 6px; font-size: .64rem; }
  }
  @media (forced-colors: active) {
    .fd-schedule-race,
    .fd-schedule-race__player--winner,
    .fd-schedule-race__discipline { border: 1px solid ButtonText; forced-color-adjust: auto; }
  }
`;

export const jflScheduleRaceClientScript = String.raw`
  (() => {
    if (window.__fdJflScheduleRaceEnhancer) return;
    window.__fdJflScheduleRaceEnhancer = true;

    const originalFetch = window.fetch.bind(window);
    let scheduleBody = null;

    const clean = (value) => String(value || '').trim();
    const matchId = (match) => clean(match.teamMatchId || match.team_match_id);
    const roundId = (round) => clean(round.roundId || round.round_id);
    const tableNumber = (match) => Number(match.tableNumber ?? match.table_number ?? 9999);
    const isFinished = (match) => ['finalized', 'corrected'].includes(clean(match.status));
    const raceResults = (match) => Array.isArray(match.playerResults) ? [...match.playerResults] : [];
    const isPostseasonRound = (round) => ['semifinal', 'championship', 'tiebreaker', 'postseason', 'playoffs'].includes(clean(round.stage).toLowerCase());
    const expectedRaceCount = (round) => isPostseasonRound(round) ? 4 : 3;

    function sortMatches(matches = []) {
      return [...matches].sort((a, b) => tableNumber(a) - tableNumber(b) || matchId(a).localeCompare(matchId(b)));
    }

    function sortedRounds(body) {
      return [...(body?.rounds || [])]
        .map((round) => ({ ...round, matches: sortMatches(round.matches || []) }))
        .sort((a, b) => clean(a.scheduledOn || '9999-12-31').localeCompare(clean(b.scheduledOn || '9999-12-31'))
          || Number(a.roundNumber || 9999) - Number(b.roundNumber || 9999)
          || roundId(a).localeCompare(roundId(b)));
    }

    function progress(racks, target) {
      const left = racks === null || racks === undefined || racks === '' ? '0' : String(racks);
      const right = target === null || target === undefined || target === '' ? '?' : String(target);
      return left + ' / ' + right;
    }

    function player(name, racks, target, tone) {
      const side = document.createElement('span');
      side.className = 'fd-schedule-race__player' + (tone ? ' fd-schedule-race__player--' + tone : '');
      const playerName = document.createElement('strong');
      playerName.textContent = clean(name) || 'Player';
      const playerProgress = document.createElement('span');
      playerProgress.className = 'fd-schedule-race__progress';
      playerProgress.textContent = progress(racks, target);
      side.append(playerName, playerProgress);
      return side;
    }

    function scoreA(result) { return result.scoreA ?? result.score_a ?? result.racksWonA ?? result.racks_won_a; }
    function scoreB(result) { return result.scoreB ?? result.score_b ?? result.racksWonB ?? result.racks_won_b; }
    function raceToA(result) { return result.raceToA ?? result.race_to_a; }
    function raceToB(result) { return result.raceToB ?? result.race_to_b; }
    function slotNumber(result, index) { return result.slotNumber ?? result.slot_number ?? result.sequenceNumber ?? result.sequence_number ?? (index + 1); }
    function openingDiscipline(result) { return clean(result.openingDiscipline || result.opening_discipline).toLowerCase(); }
    function openingLabel(result) {
      const discipline = openingDiscipline(result);
      if (discipline === '8-ball') return '8 first';
      if (discipline === '9-ball') return '9 first';
      return '';
    }

    function raceRow(result, index) {
      const winner = clean(result.winnerSide || result.winner_side).toUpperCase();
      const row = document.createElement('div');
      row.className = 'fd-schedule-race';
      const sequence = slotNumber(result, index);
      const disciplineValue = openingDiscipline(result);
      const disciplineLabel = openingLabel(result);
      row.dataset.playerMatchId = clean(result.playerMatchId || result.player_match_id);
      if (disciplineValue) row.dataset.openingDiscipline = disciplineValue;
      row.setAttribute('aria-label', 'Race ' + sequence + (disciplineLabel ? ', ' + disciplineLabel : '') + ': ' + (clean(result.playerAName || result.player_a_name) || 'Player A') + ' ' + progress(scoreA(result), raceToA(result)) + ', ' + (clean(result.playerBName || result.player_b_name) || 'Player B') + ' ' + progress(scoreB(result), raceToB(result)));
      const leftTone = winner === 'A' ? 'winner' : winner === 'B' ? 'loser' : '';
      const rightTone = winner === 'B' ? 'winner' : winner === 'A' ? 'loser' : '';
      const meta = document.createElement('span');
      meta.className = 'fd-schedule-race__meta';
      const number = document.createElement('span');
      number.className = 'fd-schedule-race__number';
      number.textContent = 'Race ' + sequence;
      meta.append(number);
      if (disciplineLabel) {
        const discipline = document.createElement('span');
        discipline.className = 'fd-schedule-race__discipline';
        discipline.textContent = disciplineLabel;
        discipline.setAttribute('aria-hidden', 'true');
        meta.append(discipline);
      }
      row.append(
        player(result.playerAName || result.player_a_name, scoreA(result), raceToA(result), leftTone),
        meta,
        player(result.playerBName || result.player_b_name, scoreB(result), raceToB(result), rightTone),
      );
      return row;
    }

    function resultSignature(match, round, results) {
      return JSON.stringify({
        id: matchId(match),
        expected: expectedRaceCount(round),
        results: results.map((result, index) => [
          slotNumber(result, index),
          clean(result.playerAName || result.player_a_name),
          scoreA(result),
          raceToA(result),
          clean(result.playerBName || result.player_b_name),
          scoreB(result),
          raceToB(result),
          clean(result.winnerSide || result.winner_side),
          openingDiscipline(result),
        ]),
      });
    }

    function decorateCard(card, match, round) {
      const id = matchId(match);
      if (id) {
        card.dataset.matchId = id;
        card.dataset.teamMatchId = id;
      }
      if (!isFinished(match)) return;
      const results = raceResults(match).sort((a, b) => Number(slotNumber(a, 9999)) - Number(slotNumber(b, 9999)));
      if (!results.length) return;
      const details = card.querySelector('.fd-schedule-match__details');
      if (!details) return;

      const signature = resultSignature(match, round, results);
      if (card.dataset.raceDetailsSignature === signature) return;

      const summary = details.querySelector('summary');
      const expected = expectedRaceCount(round);
      if (summary) summary.textContent = 'Race details · ' + results.length + ' races';
      let list = details.querySelector('.fd-schedule-match__race-list');
      if (!list) {
        list = document.createElement('div');
        list.className = 'fd-schedule-match__race-list';
        const actions = details.querySelector('.fd-schedule-match__actions');
        details.insertBefore(list, actions || null);
      }
      list.replaceChildren(...results.map(raceRow));
      const oldWarning = details.querySelector('.fd-schedule-match__race-warning');
      if (oldWarning) oldWarning.remove();
      if (results.length !== expected) {
        const warning = document.createElement('p');
        warning.className = 'fd-schedule-match__race-warning';
        warning.textContent = 'Result data is incomplete: expected ' + expected + ' races, found ' + results.length + '.';
        list.before(warning);
      }
      card.dataset.raceDetailsSignature = signature;
    }

    function decorateSchedule() {
      if (!scheduleBody) return;
      const byRound = new Map(sortedRounds(scheduleBody).map((round) => [roundId(round), round]));
      for (const section of document.querySelectorAll('.fd-schedule-round[data-round-id]')) {
        const round = byRound.get(clean(section.dataset.roundId));
        const matches = round?.matches || [];
        const cards = [...section.querySelectorAll('.fd-schedule-match')];
        cards.forEach((card, index) => {
          if (matches[index]) decorateCard(card, matches[index], round || {});
        });
      }
    }

    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      try {
        const requestUrl = new URL(typeof args[0] === 'string' ? args[0] : args[0]?.url || '', location.href);
        if (/^\/api\/seasons\/[^/]+\/schedule$/.test(requestUrl.pathname) && response.ok) {
          response.clone().json().then((body) => {
            scheduleBody = body;
            decorateSchedule();
          }).catch(() => {});
        }
      } catch {}
      return response;
    };

    const observer = new MutationObserver(() => decorateSchedule());
    const start = () => {
      const groups = document.querySelector('[data-schedule-groups]');
      if (groups) observer.observe(groups, { childList: true, subtree: true });
      decorateSchedule();
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
    else start();
  })();
`;
