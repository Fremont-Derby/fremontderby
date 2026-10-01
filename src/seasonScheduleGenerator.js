/**
 * #128 Generate league-night dates around US holidays and blackouts.
 * Pairing order unchanged — only calendar placement moves.
 */

/** Observed US federal-style holidays for a given year (month 1-12). */
export function usObservedHolidays(year) {
  const y = Number(year);
  const nthWeekday = (month, weekday, n) => {
    // weekday: 0=Sun..6=Sat
    let count = 0;
    for (let d = 1; d <= 31; d++) {
      const dt = new Date(Date.UTC(y, month - 1, d));
      if (dt.getUTCMonth() !== month - 1) break;
      if (dt.getUTCDay() === weekday) {
        count += 1;
        if (count === n) return dt.toISOString().slice(0, 10);
      }
    }
    return null;
  };
  const lastWeekday = (month, weekday) => {
    for (let d = 31; d >= 1; d--) {
      const dt = new Date(Date.UTC(y, month - 1, d));
      if (dt.getUTCMonth() !== month - 1) continue;
      if (dt.getUTCDay() === weekday) return dt.toISOString().slice(0, 10);
    }
    return null;
  };
  const fixed = (month, day) => {
    const dt = new Date(Date.UTC(y, month - 1, day));
    // observed: Sat->Fri, Sun->Mon
    const dow = dt.getUTCDay();
    if (dow === 6) dt.setUTCDate(dt.getUTCDate() - 1);
    if (dow === 0) dt.setUTCDate(dt.getUTCDate() + 1);
    return dt.toISOString().slice(0, 10);
  };

  return [
    { id: 'new_years', name: "New Year's Day", date: fixed(1, 1) },
    { id: 'mlk', name: 'MLK Day', date: nthWeekday(1, 1, 3) },
    { id: 'presidents', name: "Presidents' Day", date: nthWeekday(2, 1, 3) },
    { id: 'memorial', name: 'Memorial Day', date: lastWeekday(5, 1) },
    { id: 'juneteenth', name: 'Juneteenth', date: fixed(6, 19) },
    { id: 'independence', name: 'Independence Day', date: fixed(7, 4) },
    { id: 'labor', name: 'Labor Day', date: nthWeekday(9, 1, 1) },
    { id: 'columbus', name: 'Indigenous Peoples Day', date: nthWeekday(10, 1, 2) },
    { id: 'veterans', name: 'Veterans Day', date: fixed(11, 11) },
    { id: 'thanksgiving', name: 'Thanksgiving', date: nthWeekday(11, 4, 4) },
    { id: 'christmas', name: 'Christmas Day', date: fixed(12, 25) },
  ].filter((h) => h.date);
}

function parseYmd(ymd) {
  const [y, m, d] = String(ymd).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function formatYmd(dt) {
  return dt.toISOString().slice(0, 10);
}

function addDays(dt, n) {
  const x = new Date(dt.getTime());
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

/**
 * @param {object} opts
 * @param {string} opts.startDate YYYY-MM-DD first intended league night
 * @param {number} opts.weekday 0-6 UTC weekday for league night (default Tuesday=2)
 * @param {number} opts.roundCount
 * @param {number} opts.intervalDays days between rounds (default 7)
 * @param {string[]} opts.disabledHolidayIds
 * @param {string[]} opts.extraBlackouts YYYY-MM-DD list
 * @param {number} [opts.year]
 */
export function generateSeasonRoundDates({
  startDate,
  weekday = 2,
  roundCount = 7,
  intervalDays = 7,
  disabledHolidayIds = [],
  extraBlackouts = [],
  year,
} = {}) {
  if (!startDate) throw new Error('startDate is required');
  const start = parseYmd(startDate);
  const y = year || start.getUTCFullYear();
  const disabled = new Set(disabledHolidayIds || []);
  const holidays = usObservedHolidays(y).filter((h) => !disabled.has(h.id));
  const blackout = new Set([
    ...holidays.map((h) => h.date),
    ...((extraBlackouts || []).map((d) => String(d).slice(0, 10))),
  ]);

  // Align to weekday
  let cursor = start;
  while (cursor.getUTCDay() !== weekday) {
    cursor = addDays(cursor, 1);
  }

  const rounds = [];
  let guard = 0;
  while (rounds.length < roundCount && guard < 400) {
    guard += 1;
    const ymd = formatYmd(cursor);
    if (blackout.has(ymd)) {
      cursor = addDays(cursor, intervalDays);
      continue;
    }
    rounds.push({
      round: rounds.length + 1,
      date: ymd,
      skippedHolidays: [...blackout].filter((d) => d === ymd),
    });
    cursor = addDays(cursor, intervalDays);
  }

  return {
    rounds,
    blackoutDates: [...blackout].sort(),
    holidaysConsidered: holidays,
    weekday,
    intervalDays,
  };
}
