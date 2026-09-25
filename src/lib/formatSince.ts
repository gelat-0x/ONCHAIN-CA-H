/** Registry `since` is `YYYY-MM` — display as DD.MM.YY (day defaults to 01). */
export function formatSinceDate(since?: string): string {
  if (!since) return '—';
  const m = since.match(/^(\d{4})-(\d{2})$/);
  if (!m) return since;
  const yy = m[1].slice(-2);
  return `01.${m[2]}.${yy}`;
}
