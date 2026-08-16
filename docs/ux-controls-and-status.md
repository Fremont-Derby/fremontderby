# UX: controls vs status

## Principle
- **Rectangles = controls** (dropdowns, inputs, buttons, filter rows).
- **Pills = short status tokens** only (`Live`, `Final`, `Admin`).
- Long copy never sits in a stadium capsule.

## Radius tokens
| Token | Value | Use |
|-------|-------|-----|
| `--fd-radius-control` | 10px | `select`, `input`, rectangular status bars, hub team rows |
| `--fd-radius-sm` | 11px | Buttons |
| `--fd-radius` | 16px | Cards / panels |
| `--fd-radius-pill` | 999px | `.badge`, `.chip`, `.status-pill` only |

## Selects (rectangular)
```css
select {
  min-height: max(var(--fd-control-min), var(--fd-touch-min));
  border-radius: var(--fd-radius-control);
  width: 100%;
  font-size: 16px; /* prevent iOS zoom */
  appearance: none;
}
```

## Mobile / touch
- Minimum control height: **44px** (`--fd-touch-min`), aligned with `--fd-control-min` (46px).
- `touch-action: manipulation` on buttons to reduce double-tap zoom delay.
- Filters stack full-width under `max-width: 720px`.
- Labels should sit **above** the control (page markup); CSS makes the field itself full width.

## Pill contrast (approximate WCAG-oriented pairs)
| Tone | Background | Text |
|------|------------|------|
| Neutral | `#eef1ef` | `#1f2923` |
| Success / live | `#d8f0e2` | `#0b4d2c` |
| Warning / tonight | `#f7e7a8` | `#4a3b00` |
| Danger | `#f8d7d4` | `#7a221c` |
| Info | `#d9e8fc` | `#0b3a6e` |

Do not use light green text on light green fills. Prefer **dark text on tinted fills** for small pill type.

## Measured WCAG contrast (pill text on fill)

Ratios use relative luminance (WCAG 2.x). Pill type is ~0.78rem bold → treat as **normal text** (AA ≥ 4.5:1, AAA ≥ 7:1).

| Tone | Text on background | Ratio | AA | AAA |
|------|--------------------|------:|:--:|:---:|
| Neutral | `#1f2923` on `#eef1ef` | 13.2:1 | Yes | Yes |
| Success / live | `#0b4d2c` on `#d8f0e2` | 8.3:1 | Yes | Yes |
| Warning / tonight | `#4a3b00` on `#f7e7a8` | 8.8:1 | Yes | Yes |
| Danger | `#7a221c` on `#f8d7d4` | 7.6:1 | Yes | Yes |
| Info | `#0b3a6e` on `#d9e8fc` | 9.2:1 | Yes | Yes |

All current `--fd-pill-*` pairs meet **AAA for normal text**. Prefer these dark-on-tint pairs over light-on-light greens for small labels.


## Do not
- Apply `--fd-radius-pill` to `<select>` or long `.status` sentences.
- Treat `.hub-team` as a chip (it is a control row).
