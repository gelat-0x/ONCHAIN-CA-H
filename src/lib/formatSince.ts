/** Registry `since` is `YYYY-MM` or `YYYY-MM-DD`. Display as DD.MM.YY. A month-only date uses the 1st. */
export function formatSinceDate(since?: string): string {
  if (!since) return '—';
  const full = since.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (full) return `${full[3]}.${full[2]}.${full[1].slice(-2)}`;
  const month = since.match(/^(\d{4})-(\d{2})$/);
  if (!month) return since;
  return `01.${month[2]}.${month[1].slice(-2)}`;
}
