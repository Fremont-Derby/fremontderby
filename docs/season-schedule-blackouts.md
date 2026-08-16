# Season schedule blackouts (#128)

Use `generateSeasonRoundDates` from `src/seasonScheduleGenerator.js`:

```js
import { generateSeasonRoundDates } from './seasonScheduleGenerator.js';

const plan = generateSeasonRoundDates({
  startDate: '2026-09-08',
  weekday: 2, // Tuesday
  roundCount: 7,
  disabledHolidayIds: ['columbus'],
  extraBlackouts: ['2026-10-13'],
});
// plan.rounds => [{ round: 1, date: 'YYYY-MM-DD' }, ...]
```

Pairing order is unchanged; only calendar dates move.
