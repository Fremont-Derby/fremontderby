/**
 * Bind legacy page-local agent variables to design tokens.
 * Applied on player + admin surfaces so dark skins cannot reassert.
 */
export const tokenRemapStyles = `
  --panel: var(--fd-bg-surface) !important;
  --line: var(--fd-border) !important;
  --muted: var(--fd-text-muted) !important;
  --green: var(--fd-success) !important;
  --gold: var(--fd-accent) !important;
  --red: var(--fd-danger) !important;
  --bg: var(--fd-bg-page) !important;
  --text: var(--fd-text) !important;
`;
