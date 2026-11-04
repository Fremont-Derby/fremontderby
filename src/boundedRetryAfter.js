// RFC 9110 Retry-After: decimal delay-seconds or HTTP-date. Null means
// no usable bounded wait; callers must retain pending mutation uncertainty.
// Self-contained so the same parser can be embedded in rendered page scripts.
export function boundedRetryAfterSeconds(value, now = Date.now(), maximum = 300) {
  if (typeof value !== 'string' || !Number.isFinite(now)
      || !Number.isSafeInteger(maximum) || maximum < 0) return null;
  const text = value.trim();
  if (/^\d+$/.test(text)) {
    const seconds = Number(text);
    return Number.isSafeInteger(seconds) && seconds <= maximum ? seconds : null;
  }
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const fullDays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  let match, day, month, year, hour, minute, second, weekday;
  if ((match = /^(Sun|Mon|Tue|Wed|Thu|Fri|Sat), (\d{2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4}) (\d{2}):(\d{2}):(\d{2}) GMT$/.exec(text))) {
    [,weekday,day,month,year,hour,minute,second] = match;
  } else if ((match = /^(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday), (\d{2})-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-(\d{2}) (\d{2}):(\d{2}):(\d{2}) GMT$/.exec(text))) {
    [,weekday,day,month,year,hour,minute,second] = match;
    weekday = days[fullDays.indexOf(weekday)];
    const current = new Date(now);
    year = Math.floor(current.getUTCFullYear() / 100) * 100 + Number(year);
    if (Date.UTC(year,months.indexOf(month),Number(day),Number(hour),Number(minute),Number(second))
        > Date.UTC(current.getUTCFullYear()+50,current.getUTCMonth(),current.getUTCDate(),
          current.getUTCHours(),current.getUTCMinutes(),current.getUTCSeconds())) year -= 100;
  } else if ((match = /^(Sun|Mon|Tue|Wed|Thu|Fri|Sat) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) ([ \d]\d) (\d{2}):(\d{2}):(\d{2}) (\d{4})$/.exec(text))) {
    [,weekday,month,day,hour,minute,second,year] = match;
  } else return null;
  const at = Date.UTC(Number(year),months.indexOf(month),Number(day),Number(hour),Number(minute),Number(second));
  const date = new Date(at);
  // Reject normalized invalid dates/times and a mismatched weekday.
  if (date.getUTCFullYear() !== Number(year) || date.getUTCMonth() !== months.indexOf(month)
      || date.getUTCDate() !== Number(day) || date.getUTCHours() !== Number(hour)
      || date.getUTCMinutes() !== Number(minute) || date.getUTCSeconds() !== Number(second)
      || days[date.getUTCDay()] !== weekday) return null;
  const seconds = Math.max(0,Math.ceil((at-now)/1000));
  return seconds <= maximum ? seconds : null;
}

export const boundedRetryAfterParserSource = `const boundedRetryAfterSeconds=${boundedRetryAfterSeconds.toString()};`;
